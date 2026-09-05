import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSource } from '../../context/SourceContext';
import { ZeroStorageCredentials } from '../../types/source';
import { getSavedZeroStorageConfig } from '../../services/storageDb';
import styles from './ZeroStorageConfigModal.module.css';

export const ZeroStorageConfigModal: React.FC = () => {
  const {
    isZeroStorageConfigOpen,
    closeZeroStorageConfig,
    configureZeroStorage,
  } = useSource();

  const [apiKey, setApiKey] = useState<string>('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('https://zerostorage.net/api');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isZeroStorageConfigOpen) {
      getSavedZeroStorageConfig().then((saved) => {
        if (saved) {
          setApiKey(saved.apiKey || '');
          setApiBaseUrl(saved.apiBaseUrl || 'https://zerostorage.net/api');
        }
      });
    }
  }, [isZeroStorageConfigOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      alert('ZeroStorage API key is required');
      return;
    }

    setIsSubmitting(true);
    const creds: ZeroStorageCredentials = {
      apiKey: apiKey.trim(),
      apiBaseUrl: apiBaseUrl.trim() || 'https://zerostorage.net/api',
    };

    try {
      const ok = await configureZeroStorage(creds);
      if (!ok) {
        alert('Could not authenticate with ZeroStorage. Please check your API key.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isZeroStorageConfigOpen}
      onClose={closeZeroStorageConfig}
      title="Connect ZeroStorage"
      footer={
        <>
          <Button variant="ghost" onClick={closeZeroStorageConfig}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit as any}
            disabled={isSubmitting || !apiKey.trim()}
          >
            {isSubmitting ? 'Authenticating...' : 'Connect ZeroStorage'}
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>ZeroStorage API Key</label>
          <input
            type="password"
            className={styles.input}
            placeholder="zs_sec_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>API Base URL (Optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://zerostorage.net/api"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
          />
        </div>

        <p className={styles.note}>
          Get your API key from your account dashboard on{' '}
          <a
            href="https://zerostorage.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            zerostorage.net
          </a>
          . All folder hierarchies and media streams are securely encrypted and authenticated.
        </p>
      </form>
    </Modal>
  );
};

