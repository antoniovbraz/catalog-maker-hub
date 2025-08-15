import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import { CustomModal } from '@/components/common/CustomModal';
import { ConfirmModal } from './ConfirmModal';

export function GlobalModalRenderer() {
  const { modals, closeModal } = useModal();

  return (
    <>
      {modals.map(modal => {
        if (modal.type === 'confirm') {
          return (
            <ConfirmModal
              key={modal.id}
              open={true}
              onOpenChange={(open) => !open && closeModal(modal.id)}
              title={modal.title}
              description={modal.description || ''}
              onConfirm={modal.onSave || (() => {})}
              confirmText={modal.saveText}
              cancelText={modal.cancelText}
              variant={modal.variant}
              loading={modal.isLoading}
            />
          );
        }

        return (
          <CustomModal
            key={modal.id}
            open={true}
            onOpenChange={(open) => !open && closeModal(modal.id)}
            title={modal.title}
            description={modal.description}
            onSave={modal.onSave || (() => {})}
            onCancel={modal.onCancel}
            saveText={modal.saveText}
            cancelText={modal.cancelText}
            isLoading={modal.isLoading}
            size={modal.size}
          >
            {modal.content}
          </CustomModal>
        );
      })}
    </>
  );
}