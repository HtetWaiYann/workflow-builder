import { Info } from 'lucide-react'
import type { NodeType } from '@triggr/shared'
import { Button } from '@/components/ui/button'
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DocField {
  name: string
  description: string
}

interface DocExample {
  label: string
  value: string
}

interface NodeDoc {
  description: string
  fields: DocField[]
  examples: DocExample[]
}

const NODE_DOCS: Record<NodeType, NodeDoc> = {
  'manual-trigger': {
    description:
      'Starts the workflow on demand when you click the Run button on the canvas. No configuration is required.',
    fields: [],
    examples: [
      {
        label: 'On-demand run',
        value:
          'Click the Run button on the canvas toolbar to start this workflow manually.',
      },
    ],
  },
  'webhook-trigger': {
    description:
      'Listens for an incoming HTTP request and starts the workflow when one arrives. The request body and headers are passed to subsequent nodes.',
    fields: [
      {
        name: 'Method',
        description: 'HTTP method to accept: GET, POST, PUT, PATCH, or DELETE.',
      },
      {
        name: 'Path',
        description:
          'URL path the webhook will be registered at, e.g. /orders or /stripe/events.',
      },
    ],
    examples: [
      { label: 'Receive new orders', value: 'Method: POST\nPath: /orders' },
      {
        label: 'GitHub push event',
        value: 'Method: POST\nPath: /github/push',
      },
    ],
  },
  'cron-trigger': {
    description:
      'Runs the workflow automatically on a schedule defined by a cron expression. Uses standard 5-field cron syntax (minute hour day-of-month month day-of-week).',
    fields: [
      {
        name: 'Schedule',
        description:
          'A cron expression. Fields: minute (0–59), hour (0–23), day-of-month (1–31), month (1–12), day-of-week (0–7).',
      },
    ],
    examples: [
      { label: 'Every minute', value: '* * * * *' },
      { label: 'Every hour', value: '0 * * * *' },
      { label: 'Daily at 9 AM', value: '0 9 * * *' },
      { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
      { label: 'First day of each month', value: '0 0 1 * *' },
    ],
  },
  'http-request': {
    description:
      'Makes an HTTP request to any URL and passes the response body and status to the next node.',
    fields: [
      {
        name: 'Method',
        description: 'HTTP method: GET, POST, PUT, PATCH, or DELETE.',
      },
      {
        name: 'URL',
        description:
          'Full URL including protocol, e.g. https://api.example.com/users.',
      },
      {
        name: 'Headers (JSON)',
        description:
          'Request headers as a JSON object, e.g. {"Authorization": "Bearer token"}.',
      },
      {
        name: 'Body (JSON)',
        description:
          'Request body as a JSON object. Only shown for POST, PUT, and PATCH.',
      },
    ],
    examples: [
      {
        label: 'GET request',
        value:
          'Method: GET\nURL: https://api.example.com/users\nHeaders: {"Authorization": "Bearer {{token}}"}',
      },
      {
        label: 'POST request',
        value:
          'Method: POST\nURL: https://api.example.com/items\nBody: {"name": "Widget", "price": 9.99}',
      },
    ],
  },
  'run-js-code': {
    description:
      "Runs custom JavaScript code in a sandboxed Node.js VM. Access the previous node's output via $input and return any serializable value.",
    fields: [
      {
        name: 'Code',
        description:
          "JavaScript code to execute. Use $input to access the previous node's output. Must return a serializable value.",
      },
    ],
    examples: [
      {
        label: 'Transform data',
        value:
          'const { name, email } = $input;\nreturn { greeting: `Hello, ${name}!`, email };',
      },
      {
        label: 'Filter and map',
        value:
          'return $input.items\n  .filter(item => item.active)\n  .map(item => ({ id: item.id, name: item.name }));',
      },
    ],
  },
  'if-condition': {
    description:
      'Evaluates a condition against the input data and routes execution to the True or False branch.',
    fields: [
      {
        name: 'Field',
        description:
          'Dot-notation path to the field to evaluate, e.g. data.status or user.age.',
      },
      {
        name: 'Operator',
        description:
          'Comparison operator: ==, !=, >, <, >=, <=, contains, or not contains.',
      },
      {
        name: 'Value',
        description:
          'Value to compare against. Strings, numbers, and booleans are all supported.',
      },
    ],
    examples: [
      {
        label: 'Check HTTP status',
        value: 'Field: data.status\nOperator: ==\nValue: 200',
      },
      {
        label: 'Check user role',
        value: 'Field: user.role\nOperator: ==\nValue: admin',
      },
      {
        label: 'Age threshold',
        value: 'Field: user.age\nOperator: >=\nValue: 18',
      },
    ],
  },
  switch: {
    description:
      'Routes execution to one of several branches based on the value of a field. Each case maps a value to a named output branch.',
    fields: [
      {
        name: 'Field',
        description:
          'Dot-notation path to the field to match, e.g. data.type or order.status.',
      },
      {
        name: 'Cases',
        description:
          'List of value → label pairs. The branch whose value matches the field is taken.',
      },
    ],
    examples: [
      {
        label: 'Route by order status',
        value:
          'Field: order.status\nCases:\n  pending → Pending Branch\n  shipped → Shipped Branch\n  delivered → Done Branch',
      },
    ],
  },
  merge: {
    description:
      'Waits for all connected upstream branches to complete and then passes a merged object to the next node. No configuration required.',
    fields: [],
    examples: [
      {
        label: 'Output shape',
        value:
          '{\n  branch1: { ...outputFromBranch1 },\n  branch2: { ...outputFromBranch2 }\n}',
      },
    ],
  },
  'set-fields': {
    description:
      'Adds or overwrites fields on the data object passed to the next node. Existing fields not listed are preserved.',
    fields: [
      {
        name: 'Fields',
        description:
          'Key-value pairs to set. Values are treated as strings or JavaScript expressions.',
      },
    ],
    examples: [
      { label: 'Add a status field', value: 'key: status\nvalue: "processed"' },
      {
        label: 'Set multiple fields',
        value: 'key: name  value: "Alice"\nkey: role  value: "admin"',
      },
    ],
  },
  'filter-array': {
    description:
      'Keeps only array items that match the filter expression. The expression is evaluated for each item; truthy items are kept.',
    fields: [
      {
        name: 'Filter expression',
        description:
          'A JavaScript expression evaluated for each item. Use item to reference the current element.',
      },
    ],
    examples: [
      { label: 'Keep active items', value: 'item.active === true' },
      { label: 'Items over price threshold', value: 'item.price > 100' },
      { label: 'Items with specific role', value: 'item.role === "admin"' },
    ],
  },
  'rename-keys': {
    description:
      'Renames keys in the data object. Each mapping defines an old key name and its new name. Values are unchanged.',
    fields: [
      {
        name: 'Mappings',
        description:
          'List of from → to pairs. The old key is removed and replaced with the new key.',
      },
    ],
    examples: [
      {
        label: 'Normalize API response',
        value: 'userId → id\nfirstName → name\nemailAddress → email',
      },
    ],
  },
  'slack-message': {
    description:
      'Sends a message to a Slack channel using an Incoming Webhook URL configured in your Slack workspace.',
    fields: [
      {
        name: 'Webhook URL',
        description:
          'The Incoming Webhook URL from Slack. Found in your Slack App configuration under Incoming Webhooks.',
      },
      {
        name: 'Message',
        description:
          'The message text to send. Supports Slack markdown: *bold*, _italic_, `code`.',
      },
    ],
    examples: [
      {
        label: 'Deploy notification',
        value:
          'Webhook: https://hooks.slack.com/services/...\nMessage: Deployment to production complete ✅',
      },
      {
        label: 'Alert with data',
        value: 'Message: 🚨 Error in order {{order.id}}: {{error.message}}',
      },
    ],
  },
  'send-email': {
    description:
      'Sends an email via the configured SMTP server. Set up your SMTP credentials in the workflow settings before using this node.',
    fields: [
      {
        name: 'To',
        description:
          'Recipient email address. Use template syntax for dynamic values: {{user.email}}.',
      },
      {
        name: 'Subject',
        description: 'Email subject line. Template syntax supported.',
      },
      {
        name: 'Body',
        description:
          'Email body text. HTML is supported if your SMTP server is configured for it.',
      },
    ],
    examples: [
      {
        label: 'Order confirmation',
        value:
          'To: {{order.email}}\nSubject: Your order #{{order.id}} is confirmed\nBody: Hi {{order.name}}, your order has been placed!',
      },
    ],
  },
  delay: {
    description:
      'Pauses the workflow for a fixed duration before continuing to the next node.',
    fields: [
      {
        name: 'Duration',
        description: 'How long to pause. Must be a positive integer.',
      },
      {
        name: 'Unit',
        description: 'Time unit: seconds, minutes, or hours.',
      },
    ],
    examples: [
      { label: 'Short cooldown', value: 'Duration: 30\nUnit: Seconds' },
      { label: 'Wait 5 minutes', value: 'Duration: 5\nUnit: Minutes' },
      { label: 'Wait 1 hour', value: 'Duration: 1\nUnit: Hours' },
    ],
  },
}

function NodeDocsContent({ nodeType }: { nodeType: NodeType }) {
  const doc = NODE_DOCS[nodeType]

  return (
    <div className="space-y-4">
      <p className="text-sm">{doc.description}</p>

      {doc.fields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Fields
          </h4>
          <dl className="space-y-2">
            {doc.fields.map((f) => (
              <div key={f.name}>
                <dt className="text-xs font-medium">{f.name}</dt>
                <dd className="text-muted-foreground mt-0.5 text-xs">
                  {f.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {doc.examples.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Examples
          </h4>
          <div className="space-y-2">
            {doc.examples.map((ex) => (
              <div key={ex.label} className="bg-muted rounded-md p-2.5">
                <p className="mb-1 text-xs font-medium">{ex.label}</p>
                <pre className="text-muted-foreground font-mono text-xs whitespace-pre-wrap">
                  {ex.value}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface NodeDocsButtonProps {
  nodeType: NodeType
  nodeLabel: string
}

/**
 * Renders an info icon button that opens a dialog with documentation and
 * examples for the given node type.
 * @param nodeType - The type of node to show docs for.
 * @param nodeLabel - Display name shown in the dialog title.
 */
export function NodeDocsButton({ nodeType, nodeLabel }: NodeDocsButtonProps) {
  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label="View documentation"
        >
          <Info className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{nodeLabel}</DialogTitle>
        </DialogHeader>
        <NodeDocsContent nodeType={nodeType} />
      </DialogContent>
    </DialogRoot>
  )
}
