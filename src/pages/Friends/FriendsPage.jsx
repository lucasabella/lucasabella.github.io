import { useState, useEffect } from 'react';
import { useFriends } from '../../hooks/useFriends';
import './FriendsPage.css';

function Avatar({ name, avatarUrl }) {
  if (avatarUrl) {
    return <img className="friends__avatar" src={avatarUrl} alt={name} />;
  }
  return (
    <div className="friends__avatar friends__avatar--letter">
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function UserRow({ username, name, avatarUrl, actions }) {
  return (
    <div className="friends__user-row">
      <Avatar name={name} avatarUrl={avatarUrl} />
      <div className="friends__user-info">
        <span className="friends__user-name">{name}</span>
        <span className="friends__user-handle">@{username}</span>
      </div>
      <div className="friends__user-actions">{actions}</div>
    </div>
  );
}

export default function FriendsPage() {
  const { friends, incoming, outgoing, loading, error, load, sendRequest, accept, remove } = useFriends();
  const [addInput, setAddInput] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    load();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!addInput.trim()) return;
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);
    try {
      await sendRequest(addInput.trim());
      setAddSuccess(`Friend request sent to @${addInput.trim()}`);
      setAddInput('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-page__header">
        <h1 className="friends-page__title">Friends</h1>
        <p className="friends-page__subtitle">Connect with other chain chasers</p>
      </div>

      <div className="friends-page__body">
        {/* Add friend */}
        <section className="friends__section">
          <h2 className="friends__section-title">Add a friend</h2>
          <form className="friends__add-form" onSubmit={handleSendRequest}>
            <input
              className="friends__add-input"
              type="text"
              placeholder="Enter username (e.g. jan_de_vries)"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              disabled={addLoading}
            />
            <button className="friends__add-btn" type="submit" disabled={addLoading || !addInput.trim()}>
              {addLoading ? 'Sending...' : 'Send request'}
            </button>
          </form>
          {addError && <p className="friends__msg friends__msg--error">{addError}</p>}
          {addSuccess && <p className="friends__msg friends__msg--success">{addSuccess}</p>}
        </section>

        {loading && <p className="friends__loading">Loading...</p>}
        {error && <p className="friends__msg friends__msg--error">{error}</p>}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className="friends__section">
            <h2 className="friends__section-title">
              Incoming requests <span className="friends__badge">{incoming.length}</span>
            </h2>
            <div className="friends__list">
              {incoming.map((f) => (
                <UserRow
                  key={f.id}
                  username={f.other_username}
                  name={f.other_name}
                  avatarUrl={f.other_avatar_url}
                  actions={
                    <>
                      <button
                        className="friends__action-btn friends__action-btn--accept"
                        onClick={() => accept(f.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="friends__action-btn friends__action-btn--decline"
                        onClick={() => remove(f.id)}
                      >
                        Decline
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <section className="friends__section">
            <h2 className="friends__section-title">Sent requests</h2>
            <div className="friends__list">
              {outgoing.map((f) => (
                <UserRow
                  key={f.id}
                  username={f.other_username}
                  name={f.other_name}
                  avatarUrl={f.other_avatar_url}
                  actions={
                    <button
                      className="friends__action-btn friends__action-btn--decline"
                      onClick={() => remove(f.id)}
                    >
                      Cancel
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Friends list */}
        <section className="friends__section">
          <h2 className="friends__section-title">
            Friends {friends.length > 0 && <span className="friends__count">({friends.length})</span>}
          </h2>
          {!loading && friends.length === 0 ? (
            <p className="friends__empty">No friends yet. Search by username above to get started.</p>
          ) : (
            <div className="friends__list">
              {friends.map((f) => (
                <UserRow
                  key={f.id}
                  username={f.other_username}
                  name={f.other_name}
                  avatarUrl={f.other_avatar_url}
                  actions={
                    <button
                      className="friends__action-btn friends__action-btn--remove"
                      onClick={() => remove(f.id)}
                    >
                      Remove
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
