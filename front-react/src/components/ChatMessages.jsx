import React from 'react';

export default function ChatMessages({ messages }) {
  return (
    <>
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role}`}>
          {m.content}
        </div>
      ))}
    </>
  );
}
