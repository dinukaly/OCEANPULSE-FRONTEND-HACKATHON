import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from './api';
import {
  ProfileDraft,
  ProfileField,
  SavedProfile,
  editableProfileFields,
  profileDraft,
  profilePatch,
  readProfile,
} from './profile';

const emptyDraft: ProfileDraft = {
  firstName: '',
  lastName: '',
  contact: '',
  language: '',
  boatId: '',
};

export default function useProfile(userId: string | null, active: boolean) {
  const [saved, setSaved] = useState<SavedProfile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [loading, setLoading] = useState(Boolean(userId && active));
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const state = useRef({
    generation: 0,
    saved,
    draft,
    active,
    editing: false,
    saving: false,
    read: null as AbortController | null,
    write: null as AbortController | null,
  });
  state.current.saved = saved;
  state.current.draft = draft;
  state.current.active = active;

  const reload = useCallback(async () => {
    const current = state.current;
    if (!userId || current.editing || current.saving) return;
    current.read?.abort();
    const generation = ++current.generation;
    const controller = new AbortController();
    current.read = controller;
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.get('users/profile', {
        signal: controller.signal,
        timeout: 15000,
      });
      const result = readProfile(response.data, userId);
      if (generation !== current.generation || controller.signal.aborted)
        return;
      setSaved(result);
      setDraft(profileDraft(result.user));
    } catch (failure: any) {
      if (generation === current.generation && !controller.signal.aborted) {
        setError(
          failure.response?.data?.message ||
            'Could not reload your saved profile. Please retry.',
        );
      }
    } finally {
      if (generation === current.generation) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const current = state.current;
    current.generation++;
    current.editing = false;
    current.saving = false;
    setSaved(null);
    setDraft(emptyDraft);
    setEditing(false);
    setSaving(false);
    setError(null);
    setNotice(null);

    return () => {
      current.generation++;
      current.read?.abort();
      current.write?.abort();
    };
  }, [userId]);

  useEffect(() => {
    if (active) void reload();
    else {
      const current = state.current;
      current.read?.abort();
      if (!current.saving) current.generation++;
      setLoading(false);
    }
  }, [active, reload]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state.current.active) void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  const openEditor = useCallback(() => {
    const current = state.current;
    if (!current.saved || current.saving) return;
    current.read?.abort();
    current.generation++;
    current.editing = true;
    setLoading(false);
    setDraft(profileDraft(current.saved.user));
    setEditing(true);
    setError(null);
    setNotice(null);
  }, []);

  const change = useCallback((field: ProfileField, value: string) => {
    if (state.current.saving) return;
    setDraft((previous) => ({ ...previous, [field]: value }));
  }, []);

  const closeEditor = useCallback(() => {
    if (state.current.saving) return;
    state.current.editing = false;
    setEditing(false);
    setError(null);
  }, []);

  const discardAndReload = useCallback(() => {
    if (state.current.saving) return;
    state.current.editing = false;
    setEditing(false);
    void reload();
  }, [reload]);

  const save = useCallback(async () => {
    const current = state.current;
    if (!userId || !current.saved || !current.editing || current.saving) return;
    let patch;
    try {
      patch = profilePatch(current.saved, current.draft);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Check your profile fields.',
      );
      return;
    }
    if (!patch) {
      closeEditor();
      setNotice('No profile changes to save.');
      return;
    }

    current.saving = true;
    current.read?.abort();
    const generation = ++current.generation;
    const controller = new AbortController();
    current.write = controller;
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.put('users/update-profile', patch, {
        signal: controller.signal,
        timeout: 15000,
      });
      const result = readProfile(response.data, userId);
      if (
        result.profileVersion <= patch.expectedVersion ||
        editableProfileFields.some(
          (field) =>
            patch[field] !== undefined && result.user[field] !== patch[field],
        )
      ) {
        throw new Error('Invalid profile save acknowledgement');
      }
      if (generation !== current.generation || controller.signal.aborted)
        return;
      setSaved(result);
      setDraft(profileDraft(result.user));
      current.editing = false;
      setEditing(false);
      setNotice('Profile changes saved.');
    } catch (failure: any) {
      if (generation !== current.generation || controller.signal.aborted)
        return;
      if (failure.response?.status === 409) {
        setError(
          'Your profile changed elsewhere. Discard edits and reload before saving again.',
        );
      } else if (
        failure.response?.status >= 400 &&
        failure.response.status < 500
      ) {
        setError(
          failure.response.data?.message ||
            'Check your profile fields and try again.',
        );
      } else {
        setError(
          'Save could not be confirmed. Your edits are kept here. Reload the saved profile to check before retrying.',
        );
      }
    } finally {
      if (generation === current.generation) {
        current.saving = false;
        setSaving(false);
      }
    }
  }, [userId, closeEditor]);

  return {
    user: saved?.user.userId === userId ? saved.user : null,
    draft,
    loading,
    saving,
    editing,
    error,
    notice,
    reload,
    openEditor,
    closeEditor,
    discardAndReload,
    change,
    save,
  };
}
