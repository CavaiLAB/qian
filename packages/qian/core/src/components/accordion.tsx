import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import type { QianProps } from '../lib/test-id';
import { button } from '../lib/styles';

export type AccordionProps = QianProps<ComponentProps<typeof BaseAccordion.Root>>;
export function Accordion({ className, testId, ...props }: AccordionProps) {
  return <BaseAccordion.Root {...props} data-slot="accordion" data-testid={testId ?? 'qian-accordion'} className={cn('flex flex-col', className)} />;
}

export type AccordionItemProps = QianProps<ComponentProps<typeof BaseAccordion.Item>>;
export function AccordionItem({ className, testId, ...props }: AccordionItemProps) {
  return <BaseAccordion.Item {...props} data-slot="accordion-item" data-testid={testId ?? 'qian-accordion-item'} className={cn('border-b border-border last:border-b-0', className)} />;
}

export type AccordionHeaderProps = QianProps<ComponentProps<typeof BaseAccordion.Header>>;
export function AccordionHeader({ className, testId, ...props }: AccordionHeaderProps) {
  return <BaseAccordion.Header {...props} data-slot="accordion-header" data-testid={testId ?? 'qian-accordion-header'} className={cn('flex', className)} />;
}

export type AccordionTriggerProps = QianProps<ComponentProps<typeof BaseAccordion.Trigger>>;
export function AccordionTrigger({ className, testId, ...props }: AccordionTriggerProps) {
  return <BaseAccordion.Trigger {...props} data-slot="accordion-trigger" data-testid={testId ?? 'qian-accordion-trigger'} className={cn(button, 'h-auto w-full justify-between rounded-md px-0 py-4 text-start hover:underline', className)} />;
}

export type AccordionContentProps = QianProps<ComponentProps<typeof BaseAccordion.Panel>>;
export function AccordionContent({ className, testId, ...props }: AccordionContentProps) {
  return <BaseAccordion.Panel {...props} data-slot="accordion-content" data-testid={testId ?? 'qian-accordion-content'} className={cn('h-(--accordion-panel-height) overflow-hidden text-sm transition-[height] duration-normal data-[starting-style]:h-0 data-[ending-style]:h-0 [&>*]:pb-4 motion-reduce:transition-none', className)} />;
}
