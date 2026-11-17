import { Field as BaseField } from '@base-ui/react/field';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import type { QianProps } from '../lib/test-id';
import { control } from '../lib/styles';

export type FieldProps = QianProps<ComponentProps<typeof BaseField.Root>>;
export function Field({ className, testId, ...props }: FieldProps) {
  return <BaseField.Root {...props} data-slot="field" data-testid={testId ?? 'qian-field'} className={cn('flex flex-col gap-1.5', className)} />;
}

export type FieldLabelProps = QianProps<ComponentProps<typeof BaseField.Label>>;
export function FieldLabel({ className, testId, ...props }: FieldLabelProps) {
  return <BaseField.Label {...props} data-slot="field-label" data-testid={testId ?? 'qian-field-label'} className={cn('text-[13px] font-medium leading-5.5 text-control-foreground data-[disabled]:opacity-50', className)} />;
}

export type FieldDescriptionProps = QianProps<ComponentProps<typeof BaseField.Description>>;
export function FieldDescription({ className, testId, ...props }: FieldDescriptionProps) {
  return <BaseField.Description {...props} data-slot="field-description" data-testid={testId ?? 'qian-field-description'} className={cn('text-xs leading-4.5 text-muted-foreground', className)} />;
}

export type FieldErrorProps = QianProps<ComponentProps<typeof BaseField.Error>>;
export function FieldError({ className, testId, ...props }: FieldErrorProps) {
  return <BaseField.Error {...props} data-slot="field-error" data-testid={testId ?? 'qian-field-error'} className={cn('text-xs leading-4.5 text-destructive', className)} />;
}

export type FieldControlProps = QianProps<ComponentProps<typeof BaseField.Control>>;
export function FieldControl({ className, testId, ...props }: FieldControlProps) {
  return <BaseField.Control {...props} data-slot="field-control" data-testid={testId ?? 'qian-field-control'} className={cn(control, 'h-(--qian-input-height) px-3', className)} />;
}

export type FieldItemProps = QianProps<ComponentProps<typeof BaseField.Item>>;
export function FieldItem({ className, testId, ...props }: FieldItemProps) {
  return <BaseField.Item {...props} data-slot="field-item" data-testid={testId ?? 'qian-field-item'} className={cn('flex items-center gap-2', className)} />;
}
