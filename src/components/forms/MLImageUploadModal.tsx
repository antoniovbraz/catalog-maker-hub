import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ImageIcon, Upload, X, Check } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface MLImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
  imageUrl?: string;
  error?: string;
}

export function MLImageUploadModal({
  isOpen,
  onClose,
  productId,
  productName,
}: MLImageUploadModalProps) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false,
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async () => {
      const uploadPromises = images.map(async (image, index) => {
        if (image.uploaded) return image;

        try {
          setImages(prev => prev.map((img, i) => 
            i === index ? { ...img, uploading: true } : img
          ));

          // Upload para Supabase Storage
          const fileName = `${productId}/${Date.now()}-${image.file.name}`;
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, image.file);

          if (error) throw error;

          // Obter URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          // Salvar referência no banco
          const { error: dbError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              image_url: publicUrl,
              image_type: 'product',
              sort_order: index,
            });

          if (dbError) throw dbError;

          setImages(prev => prev.map((img, i) => 
            i === index ? { 
              ...img, 
              uploaded: true, 
              uploading: false, 
              imageUrl: publicUrl 
            } : img
          ));

          setUploadProgress(prev => prev + (100 / images.length));

          return { ...image, uploaded: true, imageUrl: publicUrl };
        } catch (error) {
          console.error('Erro no upload:', error);
          
          setImages(prev => prev.map((img, i) => 
            i === index ? { 
              ...img, 
              uploading: false, 
              error: error instanceof Error ? error.message : 'Erro no upload'
            } : img
          ));

          throw error;
        }
      });

      await Promise.allSettled(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast({
        title: "Imagens carregadas",
        description: "Imagens do produto salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: `Alguns uploads falharam: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleUpload = () => {
    if (images.length === 0) {
      toast({
        title: "Nenhuma imagem",
        description: "Adicione pelo menos uma imagem antes de fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(0);
    uploadImagesMutation.mutate();
  };

  const handleClose = () => {
    // Limpar previews para evitar memory leak
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
    setUploadProgress(0);
    onClose();
  };

  const allUploaded = images.length > 0 && images.every(img => img.uploaded);
  const hasErrors = images.some(img => img.error);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Imagens - {productName}</DialogTitle>
          <DialogDescription>
            Faça upload das imagens do produto. Máximo 10 imagens, 5MB cada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de drop */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <ImageIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
            {isDragActive ? (
              <p>Solte as imagens aqui...</p>
            ) : (
              <div>
                <p className="mb-2 text-lg font-medium">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, JPEG, GIF ou WebP até 5MB
                </p>
              </div>
            )}
          </div>

          {/* Preview das imagens */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Imagens selecionadas ({images.length})</h3>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {images.map((image, index) => (
                  <div key={index} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="size-full object-cover"
                      />
                    </div>
                    
                    {/* Status overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      {image.uploading && <LoadingSpinner size="sm" />}
                      {image.uploaded && <Check className="size-6 text-green-500" />}
                      {image.error && (
                        <div className="p-2 text-center text-red-500">
                          <X className="mx-auto mb-1 size-6" />
                          <p className="text-xs">{image.error}</p>
                        </div>
                      )}
                    </div>

                    {/* Botão remover */}
                    {!image.uploading && !image.uploaded && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute right-2 top-2 size-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeImage(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploadImagesMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fazendo upload...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadImagesMutation.isPending}
            >
              {allUploaded ? 'Fechar' : 'Cancelar'}
            </Button>
            
            {!allUploaded && (
              <Button
                onClick={handleUpload}
                disabled={images.length === 0 || uploadImagesMutation.isPending}
              >
                {uploadImagesMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Fazendo Upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Upload ({images.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Status resumo */}
          {hasErrors && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Alguns uploads falharam. Verifique as imagens marcadas com erro.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}