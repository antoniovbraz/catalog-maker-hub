import { useCollapsibleSection } from './useCollapsibleSection';

interface UseFormVisibilityProps {
  formStorageKey: string;
  listStorageKey: string;
  defaultFormOpen?: boolean;
  defaultListOpen?: boolean;
}

export const useFormVisibility = ({ 
  formStorageKey, 
  listStorageKey,
  defaultFormOpen = false,
  defaultListOpen = true 
}: UseFormVisibilityProps) => {
  const { isOpen: isFormVisible, toggle: toggleForm } = useCollapsibleSection({
    storageKey: formStorageKey,
    defaultOpen: defaultFormOpen
  });
  
  const { isOpen: isListVisible, toggle: toggleList } = useCollapsibleSection({
    storageKey: listStorageKey,
    defaultOpen: defaultListOpen
  });

  const showForm = () => {
    if (!isFormVisible) toggleForm();
  };

  const hideForm = () => {
    if (isFormVisible) toggleForm();
  };

  return {
    isFormVisible,
    isListVisible,
    showForm,
    hideForm,
    toggleForm,
    toggleList
  };
};