import { useState } from 'react';
import { getApiBase, getAuthToken, saveSettings } from '../config';

export function Settings({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [apiBase, setApiBase] = useState(getApiBase());
  const [token, setToken] = useState(getAuthToken());

  function save() {
    saveSettings(apiBase, token);
    onSaved();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Bağlantı Ayarları</h2>
        <p className="modal__hint">
          Backend adresi ve AUTH_TOKEN. Token yalnızca bu tarayıcıda saklanır (localStorage).
        </p>
        <label className="field">
          <span>API adresi</span>
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="http://localhost:4000"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>AUTH_TOKEN</span>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="bearer token"
            type="password"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn btn--primary" onClick={save}>
            Kaydet & Bağlan
          </button>
        </div>
      </div>
    </div>
  );
}
