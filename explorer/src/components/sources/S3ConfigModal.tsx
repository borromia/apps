import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSource } from '../../context/SourceContext';
import { S3Credentials } from '../../types/source';
import { getSavedS3Config } from '../../services/storageDb';
import styles from './S3ConfigModal.module.css';

export const S3ConfigModal: React.FC = () => {
  const { isS3ConfigOpen, closeS3Config, configureS3 } = useSource();

  const [endpoint, setEndpoint] = useState<string>('https://s3.amazonaws.com');
  const [region, setRegion] = useState<string>('us-east-1');
  const [bucket, setBucket] = useState<string>('');
  const [accessKeyId, setAccessKeyId] = useState<string>('');
  const [secretAccessKey, setSecretAccessKey] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isS3ConfigOpen) {
      getSavedS3Config().then((saved) => {
        if (saved) {
          setEndpoint(saved.endpoint || 'https://s3.amazonaws.com');
          setRegion(saved.region || 'us-east-1');
          setBucket(saved.bucket || '');
          setAccessKeyId(saved.accessKeyId || '');
          setSecretAccessKey(saved.secretAccessKey || '');
          setPrefix(saved.prefix || '');
        }
      });
    }
  }, [isS3ConfigOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucket.trim()) {
      alert('Bucket name is required');
      return;
    }

    setIsSubmitting(true);
    const creds: S3Credentials = {
      endpoint: endpoint.trim(),
      region: region.trim(),
      bucket: bucket.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      prefix: prefix.trim(),
    };

    try {
      const ok = await configureS3(creds);
      if (!ok) {
        alert('Could not connect to S3 with provided settings. Please verify bucket name and endpoint.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isS3ConfigOpen}
      onClose={closeS3Config}
      title="Configure Cloud Object Storage (S3 / R2)"
      footer={
        <>
          <Button variant="ghost" onClick={closeS3Config}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit as any}
            disabled={isSubmitting || !bucket.trim()}
          >
            {isSubmitting ? 'Connecting...' : 'Connect Bucket'}
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>S3 Endpoint URL</label>
          <input
            type="text"
            className={styles.input}
            placeholder="https://s3.amazonaws.com or https://<account_id>.r2.cloudflarestorage.com"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bucket Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="my-comic-bucket"
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Region</label>
          <input
            type="text"
            className={styles.input}
            placeholder="us-east-1 or auto"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Root Prefix (Optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="comics/ or manga/"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Access Key ID (Optional if bucket is public)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="AKIA..."
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Secret Access Key (Optional)</label>
          <input
            type="password"
            className={styles.input}
            placeholder="••••••••••••••••••••"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
          />
        </div>

        <p className={styles.note}>
          Ensure your S3 bucket has CORS enabled for web browser origins if making requests from localhost or standalone HTML.
        </p>
      </form>
    </Modal>
  );
};

