import React from 'react';
import NovaDespesaModal from './NovaDespesaModal';

export default function EditarDespesaModal({ despesa, onClose, onSubmit }) {
  // Reutiliza o modal de nova despesa mas com dados pré-preenchidos
  return (
    <NovaDespesaModal
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={despesa}
      isEditing={true}
    />
  );
}