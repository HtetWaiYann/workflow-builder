import type { NodeType } from '@workflow-builder/shared'
import { NoConfig } from '@/components/canvas/NodeConfigForm/NoConfig'
import { WebhookTriggerConfig } from '@/components/canvas/NodeConfigForm/WebhookTriggerConfig'
import { CronTriggerConfig } from '@/components/canvas/NodeConfigForm/CronTriggerConfig'
import { HttpRequestConfig } from '@/components/canvas/NodeConfigForm/HttpRequestConfig'
import { RunJsCodeConfig } from '@/components/canvas/NodeConfigForm/RunJsCodeConfig'
import { IfConditionConfig } from '@/components/canvas/NodeConfigForm/IfConditionConfig'
import { SwitchConfig } from '@/components/canvas/NodeConfigForm/SwitchConfig'
import { SetFieldsConfig } from '@/components/canvas/NodeConfigForm/SetFieldsConfig'
import { FilterArrayConfig } from '@/components/canvas/NodeConfigForm/FilterArrayConfig'
import { RenameKeysConfig } from '@/components/canvas/NodeConfigForm/RenameKeysConfig'
import { SlackMessageConfig } from '@/components/canvas/NodeConfigForm/SlackMessageConfig'
import { SendEmailConfig } from '@/components/canvas/NodeConfigForm/SendEmailConfig'
import { DelayConfig } from '@/components/canvas/NodeConfigForm/DelayConfig'

interface NodeConfigFormProps {
  nodeType: NodeType
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Renders the appropriate configuration form for the given node type.
 * @param nodeType - The type of node being configured.
 * @param config - Current config object stored in node.data.config.
 * @param onChange - Called with the full updated config on any field change.
 */
export function NodeConfigForm({
  nodeType,
  config,
  onChange,
}: NodeConfigFormProps) {
  switch (nodeType) {
    case 'manual-trigger':
      return <NoConfig />
    case 'webhook-trigger':
      return <WebhookTriggerConfig config={config} onChange={onChange} />
    case 'cron-trigger':
      return <CronTriggerConfig config={config} onChange={onChange} />
    case 'http-request':
      return <HttpRequestConfig config={config} onChange={onChange} />
    case 'run-js-code':
      return <RunJsCodeConfig config={config} onChange={onChange} />
    case 'if-condition':
      return <IfConditionConfig config={config} onChange={onChange} />
    case 'switch':
      return <SwitchConfig config={config} onChange={onChange} />
    case 'merge':
      return <NoConfig />
    case 'set-fields':
      return <SetFieldsConfig config={config} onChange={onChange} />
    case 'filter-array':
      return <FilterArrayConfig config={config} onChange={onChange} />
    case 'rename-keys':
      return <RenameKeysConfig config={config} onChange={onChange} />
    case 'slack-message':
      return <SlackMessageConfig config={config} onChange={onChange} />
    case 'send-email':
      return <SendEmailConfig config={config} onChange={onChange} />
    case 'delay':
      return <DelayConfig config={config} onChange={onChange} />
  }
}
