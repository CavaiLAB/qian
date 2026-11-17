import { useState } from 'react';
import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from '@cavailab/qian-core';
import type { PlatformI18n } from '@cavailab/qian-sdk';
export interface ImagePreviewProps { src: string; alt: string; i18n: PlatformI18n; className?: string; testId?: string }
export function ImagePreview({ src, alt, i18n, className, testId = 'qian-image-preview' }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const valid = /^(https?:\/\/|blob:|data:image\/(png|jpeg|gif|webp);|\/(?!\/))/.test(src);
  if (!valid) throw new Error('data.error.imageSource');
  return <div className={className} data-slot="image-preview" data-testid={testId}>
    <Button variant="ghost" onClick={() => setOpen(true)} aria-label={i18n.t('data.preview')}><img src={src} alt={alt} className="max-h-32 max-w-48 object-contain" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent closeLabel={i18n.t('common.close')}><DialogTitle>{alt}</DialogTitle><img src={src} alt={alt} className="max-h-[70vh] max-w-full object-contain" /><DialogClose>{i18n.t('common.close')}</DialogClose></DialogContent></Dialog>
  </div>;
}
