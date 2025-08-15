import { useModal, ModalConfig } from '@/contexts/ModalContext';

export function useGlobalModal() {
  const { openModal, closeModal, updateModal } = useModal();

  const showConfirmModal = (config: {
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }) => {
    return openModal({
      type: 'confirm',
      title: config.title,
      description: config.description,
      onSave: config.onConfirm,
      saveText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar',
      variant: config.variant || 'default',
      size: 'sm'
    });
  };

  const showFormModal = (config: {
    title: string;
    description?: string;
    content: React.ReactNode;
    onSave: () => void | Promise<void>;
    onCancel?: () => void;
    saveText?: string;
    cancelText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }) => {
    return openModal({
      type: 'form',
      title: config.title,
      description: config.description,
      content: config.content,
      onSave: config.onSave,
      onCancel: config.onCancel,
      saveText: config.saveText || 'Salvar',
      cancelText: config.cancelText || 'Cancelar',
      size: config.size || 'md'
    });
  };

  const showInfoModal = (config: {
    title: string;
    description?: string;
    content: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }) => {
    return openModal({
      type: 'info',
      title: config.title,
      description: config.description,
      content: config.content,
      size: config.size || 'md'
    });
  };

  const setLoading = (id: string, loading: boolean) => {
    updateModal(id, { isLoading: loading });
  };

  return {
    showConfirmModal,
    showFormModal,
    showInfoModal,
    closeModal,
    setLoading
  };
}