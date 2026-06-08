import type { NodeExecutor } from '@triggr/shared'
import { NoOpExecutor } from './nodes/noOpExecutor'
import { ManualTriggerExecutor } from './nodes/manualTriggerExecutor'
import { WebhookTriggerExecutor } from './nodes/webhookTriggerExecutor'
import { CronTriggerExecutor } from './nodes/cronTriggerExecutor'
import { HttpRequestExecutor } from './nodes/httpRequestExecutor'
import { RunJsCodeExecutor } from './nodes/runJsCodeExecutor'
import { IfConditionExecutor } from './nodes/ifConditionExecutor'
import { SwitchExecutor } from './nodes/switchExecutor'
import { MergeExecutor } from './nodes/mergeExecutor'
import { SetFieldsExecutor } from './nodes/setFieldsExecutor'
import { FilterArrayExecutor } from './nodes/filterArrayExecutor'
import { RenameKeysExecutor } from './nodes/renameKeysExecutor'
import { SlackMessageExecutor } from './nodes/slackMessageExecutor'
import { SendEmailExecutor } from './nodes/sendEmailExecutor'
import { DelayExecutor } from './nodes/delayExecutor'

const executors = new Map<string, NodeExecutor>()

const register = (executor: NodeExecutor): void => {
  executors.set(executor.type, executor)
}

register(new NoOpExecutor())
register(new ManualTriggerExecutor())
register(new WebhookTriggerExecutor())
register(new CronTriggerExecutor())
register(new HttpRequestExecutor())
register(new RunJsCodeExecutor())
register(new IfConditionExecutor())
register(new SwitchExecutor())
register(new MergeExecutor())
register(new SetFieldsExecutor())
register(new FilterArrayExecutor())
register(new RenameKeysExecutor())
register(new SlackMessageExecutor())
register(new SendEmailExecutor())
register(new DelayExecutor())

/** Returns the executor for a node type, or undefined if none is registered. */
export const getExecutor = (type: string): NodeExecutor | undefined =>
  executors.get(type)
