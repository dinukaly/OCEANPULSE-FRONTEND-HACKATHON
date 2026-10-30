import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import api from './api';
import { readSosReceipt, sosDeadline, SosCoordinates, SosReceipt, validSosCoordinates } from './sos';

type Phase = 'ready' | 'locating' | 'submitting' | 'checking' | 'recorded' | 'error';
const uncertainMessage = 'Could not confirm whether the server recorded your request. Check the server receipt or retry. Retrying returns an existing active record without changing its original location or time.';

export default function useSosRequest() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [receipt, setReceipt] = useState<SosReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const state = useRef({ active: true, generation: 0, busy: false, recorded: false, uncertain: false,
    pending: null as SosCoordinates | null, controller: null as AbortController | null });

  useEffect(() => {
    state.current.active = true;
    return () => {
      state.current.active = false;
      state.current.generation++;
      state.current.controller?.abort(); // Stops local waiting; cannot withdraw a server write.
    };
  }, []);

  const send = useCallback(async () => {
    const current = state.current;
    if (!current.active || current.busy || current.recorded) return;
    current.busy = true;
    const generation = ++current.generation;
    const active = () => current.active && generation === current.generation;
    let requestStarted = false;
    setErrorMessage('');
    setLocationDenied(false);
    setPhase(current.pending ? 'submitting' : 'locating');
    try {
      if (!current.pending) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active()) return;
        if (permission.status !== 'granted') {
          setLocationDenied(true);
          setErrorMessage('Location permission is required. No SOS request was submitted.');
          setPhase('error');
          return;
        }
        const location = await sosDeadline(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), 15_000);
        if (!active()) return;
        if (!validSosCoordinates(location.coords)) throw new Error('Invalid current location');
        current.pending = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      }
      if (!active()) return;
      setPhase('submitting');
      const controller = new AbortController();
      current.controller = controller;
      requestStarted = true;
      const response = await sosDeadline(api.post('sosAlerts/sos', current.pending,
        { timeout: 15_000, signal: controller.signal }), 15_000, () => controller.abort());
      if (!active()) return;
      if (response.data?.success !== true) throw new Error('Unconfirmed SOS request');
      const saved = readSosReceipt(response.data.data);
      current.recorded = true;
      current.uncertain = false;
      setUncertain(false);
      setReceipt(saved);
      setPhase('recorded');
    } catch {
      if (!active()) return;
      if (requestStarted) {
        current.uncertain = true;
        setUncertain(true);
      }
      setErrorMessage(current.uncertain ? uncertainMessage
        : 'Could not get your current location. No SOS request was submitted. Check location services and try again.');
      setPhase('error');
    } finally { if (active()) current.busy = false; }
  }, []);

  const checkReceipt = useCallback(async () => {
    const current = state.current;
    if (!current.active || current.busy || current.recorded) return;
    current.busy = true;
    const generation = ++current.generation;
    const active = () => current.active && generation === current.generation;
    const controller = new AbortController();
    current.controller = controller;
    setPhase('checking');
    setErrorMessage('');
    try {
      const response = await sosDeadline(api.get('sosAlerts/current', { timeout: 15_000, signal: controller.signal }),
        15_000, () => controller.abort());
      if (!active()) return;
      if (response.data?.success !== true || !response.data.data || !('receipt' in response.data.data)) throw new Error('Invalid receipt lookup');
      if (response.data.data.receipt === null) {
        setErrorMessage(current.uncertain
          ? 'No active receipt is visible yet. An earlier submission may still be processing. Check again or retry; this check did not cancel it.'
          : 'No active SOS record was found. This check did not submit a request.');
        setPhase('error');
        return;
      }
      const saved = readSosReceipt(response.data.data.receipt);
      current.recorded = true;
      current.uncertain = false;
      setUncertain(false);
      setReceipt(saved);
      setPhase('recorded');
    } catch {
      if (!active()) return;
      setErrorMessage(current.uncertain ? uncertainMessage
        : 'Could not check the server receipt. This check did not submit a request. Please try again.');
      setPhase('error');
    } finally { if (active()) current.busy = false; }
  }, []);

  return { phase, receipt, errorMessage, locationDenied, uncertain, send, checkReceipt };
}
