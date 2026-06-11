import type { DocPageData } from '@/types/docs'

export const DOC_PAGES: DocPageData[] = [
  // ── Getting Started ────────────────────────────────────────────────────────
  {
    id: 'introduction',
    title: 'Introduction',
    blocks: [
      {
        type: 'text',
        content:
          'Triggr is a visual workflow automation platform. You build automations by placing nodes on a canvas and connecting them — no coding required for most tasks. Think of it like drawing a flowchart where each box actually does something: fetches data, sends a message, makes a decision, or runs a piece of code.',
      },
      {
        type: 'text',
        content:
          'Workflows start when a trigger fires — on a schedule, when a webhook receives a request, or when you click Run. Data flows from node to node, and each step transforms or acts on what came before.',
      },
      {
        type: 'intro-cards',
        cards: [
          {
            step: '1',
            title: 'Choose a trigger',
            desc: 'Decide what starts your workflow — a schedule, an incoming webhook, or a manual click.',
          },
          {
            step: '2',
            title: 'Add nodes',
            desc: 'Drag actions, logic, transforms, and notifications onto the canvas and connect them.',
          },
          {
            step: '3',
            title: 'Run and monitor',
            desc: 'Activate your workflow and track every execution in the history panel.',
          },
        ],
      },
    ],
  },

  {
    id: 'tech-stack',
    title: 'Technology Stack',
    blocks: [
      {
        type: 'text',
        content:
          'For those curious about what runs under the hood, here is a complete overview of the technologies powering Triggr.',
      },
      {
        type: 'table',
        headers: ['Layer', 'Technology', 'Purpose'],
        rows: [
          [
            'Frontend',
            'React 19 + TypeScript',
            'The visual interface and canvas editor',
          ],
          ['Canvas', 'React Flow', 'Drag-and-drop node-based workflow editor'],
          [
            'Styling',
            'Tailwind CSS + shadcn/ui',
            'Utility-first styling and component library',
          ],
          [
            'Backend',
            'Node.js 24 + Express 4',
            'REST API server and business logic',
          ],
          [
            'Database',
            'PostgreSQL + Prisma',
            'Persistent data storage with type-safe queries',
          ],
          [
            'Queue',
            'BullMQ + Redis',
            'Background job processing and scheduled runs',
          ],
          [
            'Auth',
            'JWT via httpOnly cookies',
            'Secure sessions without exposing tokens to JavaScript',
          ],
          [
            'Code sandbox',
            'isolated-vm',
            'Safe execution of user-supplied JavaScript',
          ],
        ],
      },
    ],
  },

  {
    id: 'local-setup',
    title: 'Local Setup',
    blocks: [
      {
        type: 'text',
        content:
          'Follow these steps to run Triggr on your own machine for development or testing.',
      },
      { type: 'heading', content: 'Prerequisites' },
      {
        type: 'bullet-list',
        items: [
          'Node.js version 24 or higher — check with `node --version`',
          'PostgreSQL running locally (any recent version)',
          'Redis running locally, typically on port 6379',
        ],
      },
      { type: 'heading', content: 'Steps' },
      {
        type: 'steps',
        start: 1,
        items: [
          'Clone the repository, then run `npm install` in the root folder to install all dependencies.',
          'Inside `packages/backend/`, create a `.env` file. You can copy `.env.example` as a starting point.',
          'Fill in `DATABASE_URL` with your PostgreSQL connection string:',
        ],
      },
      {
        type: 'code-block',
        content: 'postgresql://user:password@localhost:5432/triggr',
      },
      {
        type: 'steps',
        start: 4,
        items: [
          'Set `REDIS_URL` (usually `redis://localhost:6379`).',
          'Set `JWT_SECRET` to any random string of at least 32 characters.',
          'Set `ENCRYPTION_KEY` to a random string of exactly 32 characters. This is used to encrypt stored secrets.',
          'Run `npm run build:shared` to compile the shared package. You must do this before the first run and after any changes to the shared package.',
          'Run `npm run db:migrate` to create the database tables.',
          'Open two terminals. In the first, run `npm run dev:backend`. In the second, run `npm run dev:frontend`.',
          'Open `http://localhost:5173` in your browser.',
        ],
      },
    ],
  },

  {
    id: 'deployment',
    title: 'Server Deployment',
    blocks: [
      {
        type: 'text',
        content:
          'To deploy Triggr on your own server, you will need Node.js 24 or higher, PostgreSQL, and Redis available on the host.',
      },
      {
        type: 'steps',
        start: 1,
        items: [
          "Before building, set the environment variable `VITE_API_URL` to your backend's public URL (e.g. `https://api.yourdomain.com`).",
          'Run `npm run build` to produce production bundles for both the frontend and backend.',
          'Set the following environment variables on your server:',
        ],
      },
      {
        type: 'env-vars-list',
        items: [
          { key: 'DATABASE_URL', desc: 'PostgreSQL connection string' },
          { key: 'REDIS_URL', desc: 'Redis connection string' },
          { key: 'JWT_SECRET', desc: 'At least 32 random characters' },
          { key: 'ENCRYPTION_KEY', desc: 'Exactly 32 characters' },
          { key: 'NODE_ENV', desc: 'Set to production' },
        ],
      },
      {
        type: 'steps',
        start: 4,
        items: [
          'Run `npm run db:migrate` to apply database migrations.',
          'Start the API server:',
        ],
      },
      { type: 'code-block', content: 'node packages/backend/dist/index.js' },
      {
        type: 'steps',
        start: 6,
        items: [
          'Start the background worker (handles scheduled runs and queue processing):',
        ],
      },
      { type: 'code-block', content: 'node packages/backend/dist/worker.js' },
      {
        type: 'steps',
        start: 7,
        items: [
          'Serve the `packages/frontend/dist/` folder using nginx, Caddy, or any static file server. Configure it to proxy `/api/*` requests to the backend.',
        ],
      },
    ],
  },

  // ── Your Workspace ─────────────────────────────────────────────────────────
  {
    id: 'workspaces',
    title: 'Workspaces',
    blocks: [
      {
        type: 'text',
        content:
          'A workspace is your private space inside Triggr. All your workflows, team members, and environment variables belong to a workspace. You can have multiple workspaces to keep different projects or clients separate.',
      },
      { type: 'heading', content: 'Creating a workspace' },
      {
        type: 'text',
        content:
          'When you sign up, a default workspace is created for you automatically. To create additional workspaces, click the workspace name in the top-left corner of the app and select **New workspace**.',
      },
      { type: 'heading', content: 'Renaming a workspace' },
      {
        type: 'text',
        content:
          'Go to **Workspace Settings** (found in the top-left dropdown). The rename option is available to workspace Owners only.',
      },
      { type: 'heading', content: 'Switching workspaces' },
      {
        type: 'text',
        content:
          'Click the workspace name in the top-left corner of any page to open the workspace switcher. All workspaces you belong to are listed there.',
      },
    ],
  },

  {
    id: 'members-roles',
    title: 'Members & Roles',
    blocks: [
      {
        type: 'text',
        content:
          'Each workspace has members with one of three roles. Roles determine what each member can see and do.',
      },
      {
        type: 'table',
        headers: ['Role', 'What they can do'],
        rows: [
          [
            'Owner',
            'Full access to everything. Can invite and remove members, assign roles, rename the workspace, and create or delete environment variables. The person who creates a workspace starts as its Owner.',
          ],
          [
            'Editor',
            'Can create, edit, and delete workflows. Can view all members. Cannot manage workspace settings, invite members, or modify environment variables.',
          ],
          [
            'Viewer',
            'Read-only access. Can view workflows and their run history. Cannot create, edit, or delete anything.',
          ],
        ],
      },
      {
        type: 'note',
        content:
          'You cannot remove or demote the last Owner of a workspace. At least one Owner must remain at all times.',
      },
    ],
  },

  {
    id: 'invitations',
    title: 'Invitations',
    blocks: [
      {
        type: 'text',
        content:
          'Workspace Owners can invite other people by email. Here is how the invitation process works from start to finish.',
      },
      {
        type: 'steps',
        items: [
          'Open **Workspace Settings** from the top-left dropdown and go to the **Members** tab.',
          "Click **Invite Member**, enter the person's email address, and choose their role (Editor or Viewer).",
          'Click **Send Invite**. The person receives an email with a unique link.',
          'They click the link, log in or register if needed, and accept the invitation on the page that opens.',
          'Once they accept, they appear in your Members list and have access to the workspace.',
        ],
      },
      {
        type: 'note',
        content:
          'Invitation links expire after 7 days. The recipient must sign in with the exact email address the invite was sent to. If an invite expires or gets lost, you can resend it from the Members tab.',
      },
    ],
  },

  {
    id: 'env-variables',
    title: 'Environment Variables',
    blocks: [
      {
        type: 'text',
        content:
          'Environment Variables let you store sensitive values — like API keys, passwords, and webhook URLs — securely inside your workspace. Values are encrypted at rest and are never exposed to the browser after saving. Use them in node configuration fields instead of pasting credentials directly.',
      },
      { type: 'heading', content: 'How to create a variable' },
      {
        type: 'steps',
        items: [
          'Go to **Environment Variables** from the top-right dropdown menu.',
          'Click **New Variable**.',
          'Enter a key name using uppercase letters, numbers, and underscores only. Examples: `SLACK_WEBHOOK`, `SENDGRID_KEY`, `SMTP_PASSWORD`.',
          'Enter the value and save.',
        ],
      },
      { type: 'heading', content: 'Using a variable in a node' },
      {
        type: 'text',
        content:
          "In any node configuration field, type the variable's key wrapped in double curly braces with {var:$vars.} prefix:",
      },
      {
        type: 'code-block',
        variant: 'var',
        content: '{{ $vars.SLACK_WEBHOOK }}',
      },
      {
        type: 'text',
        content:
          'When the workflow runs, the placeholder is replaced with the stored value automatically.',
      },
      {
        type: 'note',
        content:
          'Only workspace Owners can create, edit, or delete environment variables. Editors and Viewers can reference them in workflows but cannot view or change the stored values.',
      },
    ],
  },

  // ── Triggers ───────────────────────────────────────────────────────────────
  {
    id: 'manual-trigger',
    title: 'Manual Trigger',
    blocks: [
      { type: 'node-header', category: 'Trigger' },
      {
        type: 'text',
        content:
          'Starts your workflow immediately when you click the Run button on the canvas. No configuration is needed. Use this while building and testing, or for workflows you want to start on demand.',
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'On-demand run',
            value:
              'Click the Run button in the canvas toolbar at the top of the screen.\nThe workflow starts from this node and flows through all connected nodes.',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Great for testing your workflow while building it. Switch to a Webhook or Schedule trigger later when you are ready to automate.',
        ],
      },
    ],
  },

  {
    id: 'webhook-trigger',
    title: 'Webhook Trigger',
    blocks: [
      { type: 'node-header', category: 'Trigger' },
      {
        type: 'text',
        content:
          'Listens for an incoming HTTP request and starts your workflow when one arrives. Configure the URL path and HTTP method, then paste the generated webhook URL into the service that will call it. The request body becomes the data passed to downstream nodes.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Choose the HTTP method your sending service will use — POST is the most common choice for webhooks.',
          'Enter a unique URL path such as `/new-order` or `/github/push`. It must start with a forward slash.',
          'Save the node — the full webhook URL appears in the configuration panel. Copy it.',
          'Paste the webhook URL into the service that will send requests to it (e.g. Stripe, GitHub, Shopify).',
          'Optional: enable the HMAC signature secret and copy it into the sending service to verify that requests are authentic.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Method',
            required: true,
            description:
              'The HTTP method to accept: GET, POST, PUT, PATCH, or DELETE. Most webhook senders use POST.',
          },
          {
            name: 'Path',
            required: true,
            description:
              'The URL path for this webhook, e.g. /orders or /stripe/events. Must start with /.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Receive new orders',
            value: 'Method: POST\nPath: /new-order',
          },
          {
            label: 'GitHub push notifications',
            value: 'Method: POST\nPath: /github/push',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'The complete webhook URL (e.g. https://yourdomain.com/webhooks/new-order) is shown in the node config panel after saving.',
          'Most third-party services have a Webhooks section in their settings where you paste the URL.',
          'Enable the HMAC secret if your sending service supports it — this prevents fake requests from triggering your workflow.',
        ],
      },
    ],
  },

  {
    id: 'cron-trigger',
    title: 'Schedule Trigger',
    blocks: [
      { type: 'node-header', category: 'Trigger' },
      {
        type: 'text',
        content:
          'Runs your workflow automatically on a repeating schedule. You define the schedule using a cron expression — a compact format that describes times and intervals precisely. The workflow fires at each scheduled time without any manual action.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Enter a cron expression in the Schedule field. It has 5 space-separated parts: minute, hour, day-of-month, month, day-of-week.',
          'Use * in any part to mean every. For example, * in the minute field means every minute.',
          'Not sure what to write? Visit crontab.guru in your browser — it is a free tool that lets you build and preview cron expressions in plain English.',
          'Save and activate the workflow. It will run automatically at the next scheduled time.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Schedule',
            required: true,
            description:
              'A cron expression with 5 fields: minute (0–59), hour (0–23), day-of-month (1–31), month (1–12), day-of-week (0–7, where 0 and 7 both mean Sunday).',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          { label: 'Every day at 9:00 AM', value: '0 9 * * *' },
          { label: 'Weekdays at 9:00 AM (Mon–Fri)', value: '0 9 * * 1-5' },
          { label: 'Every hour on the hour', value: '0 * * * *' },
          { label: 'First day of each month at midnight', value: '0 0 1 * *' },
          { label: 'Every 15 minutes', value: '*/15 * * * *' },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'crontab.guru is the easiest way to build cron expressions — type your schedule and see it explained in plain English.',
          'The workflow runs in the server timezone. Account for any timezone offset when setting your schedule.',
        ],
      },
    ],
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  {
    id: 'http-request',
    title: 'HTTP Request',
    blocks: [
      { type: 'node-header', category: 'Action' },
      {
        type: 'text',
        content:
          'Sends an HTTP request to any URL and makes the response available to the next node. Use it to call external APIs, fetch data from a REST endpoint, or push data to a service that accepts HTTP requests.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Enter the full URL of the API endpoint you want to call. It must start with `https://`.',
          'Choose the HTTP method: GET to read data, POST to create, PUT or PATCH to update, DELETE to remove.',
          'For POST, PUT, or PATCH requests, add a JSON body with the data you want to send.',
          'Add any required headers in the Headers field as a JSON object. Most APIs require an Authorization header.',
          'The response status code, headers, and body are all passed to the next node as output.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'URL',
            required: true,
            description:
              'The full endpoint URL, starting with https://. Example: https://api.example.com/users',
          },
          {
            name: 'Method',
            required: true,
            description: 'The HTTP method: GET, POST, PUT, PATCH, or DELETE.',
          },
          {
            name: 'Headers',
            required: false,
            description:
              'Request headers as a JSON object. Example: {"Authorization": "Bearer your-token"}',
          },
          {
            name: 'Body',
            required: false,
            description:
              'Request body as a JSON object. Applies to POST, PUT, and PATCH only. Example: {"status": "active"}',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Fetch a user from an API',
            value:
              'URL: https://api.example.com/users/123\nMethod: GET\nHeaders: {"Authorization": "Bearer my-token"}',
          },
          {
            label: 'Create a record',
            value:
              'URL: https://api.example.com/orders\nMethod: POST\nBody: {"product": "Widget", "qty": 2}',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Store your API key as an Environment Variable (e.g. {{ $vars.API_KEY }}) and reference it in the Headers field.',
          'The response body is available to the next node. If the API returns JSON, access each field as body.fieldName.',
          'Use an If Condition node after this one to branch based on the response status code.',
        ],
      },
    ],
  },

  {
    id: 'run-js-code',
    title: 'Run JavaScript',
    blocks: [
      { type: 'node-header', category: 'Action' },
      {
        type: 'text',
        content:
          'Runs a custom JavaScript function in a secure, isolated environment. Use it when you need logic that the other nodes do not cover — calculating values, transforming data structures, formatting text, or making decisions based on complex conditions. The code cannot access the internet, your file system, or any Node.js-specific APIs.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Write your JavaScript code in the Code field.',
          'Access data from the previous node using the `$input` variable. For example, `$input.userId` gives you the userId field.',
          'Your code must end with a return statement that returns a plain object. Example: `return { total: $input.price * 1.1 }`.',
          'The object you return becomes the data passed to the next node.',
          'Run the workflow and check the execution log to verify what your code returned.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Code',
            required: true,
            description:
              "JavaScript code to execute. Must end with return { ... }. Has access to $input (the previous node's output). Common built-ins like Math, JSON, Date, and Array methods all work.",
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Calculate a total with tax',
            value:
              'const taxRate = 0.2\nconst total = $input.price * (1 + taxRate)\nreturn { total, taxRate }',
          },
          {
            label: 'Format a full name',
            value:
              'const full = `${$input.firstName} ${$input.lastName}`\nreturn { fullName: full.trim() }',
          },
          {
            label: 'Check if a list is empty',
            value:
              'return { isEmpty: $input.items.length === 0, count: $input.items.length }',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Code runs in a sandbox with a 5-second time limit and 128 MB memory. Keep it fast and focused.',
          'Always return a plain object — returning null, an array, or a string will cause the node to fail.',
          'Common JavaScript built-ins like Math, JSON, Date, and Array methods all work normally inside the sandbox.',
        ],
      },
    ],
  },

  // ── Logic ──────────────────────────────────────────────────────────────────
  {
    id: 'if-condition',
    title: 'If Condition',
    blocks: [
      { type: 'node-header', category: 'Logic' },
      {
        type: 'text',
        content:
          'Checks a condition and routes your workflow down one of two paths — True or False. Connect different nodes to each output handle on the canvas. Only the branch that matches the condition continues running.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'In the Field field, type the name of the data field you want to check. Use dot notation for nested data (e.g. `order.status` or `user.age`).',
          'Choose an operator from the dropdown.',
          'Enter the value to compare against in the Value field.',
          'On the canvas, connect nodes to the True output handle and the False output handle.',
          'When the workflow runs, it follows only the matching branch.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Field',
            required: true,
            description:
              'The data field to check. Use dot notation for nested fields: status, user.age, order.items.length.',
          },
          {
            name: 'Operator',
            required: true,
            description:
              'How to compare: == (equals), != (not equals), > (greater than), < (less than), >= (at least), <= (at most), contains (text includes value), not contains (text excludes value).',
          },
          {
            name: 'Value',
            required: true,
            description:
              'The value to compare against. Enter text for string comparisons, a number for numeric comparisons.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Check if an order is paid',
            value: 'Field: order.status\nOperator: ==\nValue: paid',
          },
          {
            label: 'Check if age is 18 or over',
            value: 'Field: user.age\nOperator: >=\nValue: 18',
          },
          {
            label: 'Check if email matches a domain',
            value: 'Field: user.email\nOperator: contains\nValue: @company.com',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Use a Merge node after a branch to bring both paths back together when they should continue as one.',
          'Chain multiple If Condition nodes for multi-step decision logic.',
        ],
      },
    ],
  },

  {
    id: 'switch',
    title: 'Switch',
    blocks: [
      { type: 'node-header', category: 'Logic' },
      {
        type: 'text',
        content:
          'Routes your workflow to one of several branches based on the value of a field. Like a multi-way If — each case is a possible value, and the workflow takes the matching branch. A Default branch handles any value that does not match a case.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'In the Field field, enter the name of the data field whose value you want to match (e.g. `order.status`).',
          'Click **Add Case** for each possible value you want to handle. Give each case a label (for display on the canvas) and the exact value it should match.',
          'On the canvas, connect a different node to each case output handle.',
          'Connect a node to the Default handle to handle values not covered by your cases.',
          'Activate and run the workflow — it routes to the case whose value matches the field.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Field',
            required: true,
            description:
              'The data field to match. Example: order.status, payment.method.',
          },
          {
            name: 'Cases',
            required: true,
            description:
              'A list of cases. Each case has a Value (exact match, e.g. pending) and a Label (shown as the handle name on the canvas).',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Route by order status',
            value:
              'Field: order.status\n\nCases:\n  Value: pending   →  Label: Pending Order\n  Value: paid      →  Label: Paid Order\n  Value: cancelled →  Label: Cancelled\n\nDefault: unrecognised status',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'The Default branch is always present — use it to handle unexpected values or edge cases.',
          'Unlike If Condition, Switch only routes — all fields from the previous node pass through unchanged.',
        ],
      },
    ],
  },

  {
    id: 'merge',
    title: 'Merge',
    blocks: [
      { type: 'node-header', category: 'Logic' },
      {
        type: 'text',
        content:
          'Waits for all connected upstream branches to finish, then combines their outputs into a single object and passes it to the next node. Use it after an If Condition or Switch node to bring multiple branches back together.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Place this node on the canvas at the point where your branches should reunite.',
          'Connect the output of each branch to an input handle of this node. New input handles appear as you connect more.',
          'No configuration needed — the node waits for all connected inputs before continuing.',
          'The next node receives a merged object containing all fields from all branches.',
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Reunite after an If Condition',
            value:
              'True branch  → Send Slack message → Merge\nFalse branch → Send email       → Merge\n\nThe node after Merge receives the combined data\nfrom whichever branch ran.',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          "If only one branch ran (e.g. only the True path fired), Merge still works — it just passes that branch's data through.",
          'Merge does a shallow merge. If two branches set the same field name, the last one wins.',
        ],
      },
    ],
  },

  // ── Transform ──────────────────────────────────────────────────────────────
  {
    id: 'set-fields',
    title: 'Set Fields',
    blocks: [
      { type: 'node-header', category: 'Transform' },
      {
        type: 'text',
        content:
          'Adds new fields to the data or overwrites existing ones. Use it to label data, attach calculated values, set a status flag, or prepare a clean data object for the next step. All existing fields are preserved — you only change the ones you specify.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Click **Add Field** to add a new key-value pair.',
          'In the Key column, enter the field name you want to add or update (e.g. `status`, `category`, `processedAt`).',
          'In the Value column, enter the value to set. You can enter a string, number, or true/false.',
          'Add as many fields as you need.',
          'The next node receives the original data with your new or updated fields applied.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Fields',
            required: true,
            description:
              'A list of key-value pairs. Key is the field name to add or overwrite; Value is the new value.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Mark a record as processed',
            value:
              'Key: status      → Value: processed\nKey: processedAt → Value: 2024-01-15',
          },
          {
            label: 'Add a category label',
            value: 'Key: category → Value: premium',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'You can overwrite existing fields — just use the same key name and the old value will be replaced.',
          'Set Fields is often used right before a notification node to prepare a clean, readable data object.',
        ],
      },
    ],
  },

  {
    id: 'filter-array',
    title: 'Filter Array',
    blocks: [
      { type: 'node-header', category: 'Transform' },
      {
        type: 'text',
        content:
          'Filters an array of items, keeping only the ones that match a condition you write in JavaScript. The input data must include an array field named `items` or `data`. Use it to remove unwanted records before processing them downstream.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Make sure the node before this one outputs an `items` or `data` array. Each element will be evaluated.',
          'Write a JavaScript expression in the Expression field that returns true for items to keep and false for items to remove.',
          'Use the `item` variable to refer to each element. Example: `item.active === true` keeps only items where active is true.',
          'The filtered array is passed to the next node as `items`.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Expression',
            required: true,
            description:
              'A JavaScript expression evaluated for each item. Return true to keep the item, false to remove it. Use item to refer to the current element. Example: item.price > 100',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          { label: 'Keep only active users', value: 'item.active === true' },
          { label: 'Keep orders over $50', value: 'item.total > 50' },
          {
            label: 'Keep items from one category',
            value: "item.category === 'electronics'",
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'If an item causes an error in the expression, it is silently excluded from the result — useful for inconsistent data.',
          'For more complex filtering (nested arrays, multiple conditions), use the Run JavaScript node instead.',
        ],
      },
    ],
  },

  {
    id: 'rename-keys',
    title: 'Rename Keys',
    blocks: [
      { type: 'node-header', category: 'Transform' },
      {
        type: 'text',
        content:
          'Renames fields in the data object without changing their values. Use it to match the field names expected by an API or downstream node, or to clean up awkward names received from an external source. Fields not listed in your mappings pass through unchanged.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Click **Add Mapping** for each field you want to rename.',
          'In the From column, enter the current field name exactly as it appears in the data.',
          'In the To column, enter the new name you want for that field.',
          'The next node receives the same data with your renamed fields applied.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Mappings',
            required: true,
            description:
              'A list of from → to pairs. From is the current key name; To is the new name. The stored value is unchanged.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Convert snake_case to camelCase',
            value:
              'From: user_id    → To: userId\nFrom: created_at → To: createdAt\nFrom: first_name → To: firstName',
          },
          {
            label: 'Standardise API field names',
            value: 'From: UserEmail → To: email\nFrom: UserName  → To: name',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Only fields listed in your mappings are renamed. All other fields pass through as-is.',
          'If the From field does not exist in the data, that mapping is skipped — no error occurs.',
        ],
      },
    ],
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  {
    id: 'slack-message',
    title: 'Slack Message',
    blocks: [
      { type: 'node-header', category: 'Notify' },
      {
        type: 'text',
        content:
          'Posts a message to a Slack channel using an Incoming Webhook URL. Slack Incoming Webhooks are the simplest way to send automated messages — no bot tokens or complex permissions required. You will need a Slack workspace and permission to add apps.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Go to `api.slack.com/apps` and sign in with your Slack account.',
          'Click **Create New App** and choose **From scratch**. Give your app a name (e.g. Triggr) and select your workspace.',
          'In the left sidebar of your new app, click **Incoming Webhooks**.',
          'Toggle **Activate Incoming Webhooks** to On.',
          'Click **Add New Webhook to Workspace**. Select the channel where messages should appear and click Allow.',
          'Copy the webhook URL that appears — it starts with `https://hooks.slack.com/services/...`',
          "Paste it into the Webhook URL field in this node's configuration.",
          'Enter the message you want to post in the Message field.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Webhook URL',
            required: true,
            description:
              'Your Slack Incoming Webhook URL. Starts with https://hooks.slack.com/services/T.../B.../...',
          },
          {
            name: 'Message',
            required: true,
            description:
              'The plain text message to post. Supports basic Slack formatting: *bold*, _italic_, and <https://url|link text>.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Post an alert to a channel',
            value:
              'Webhook URL: https://hooks.slack.com/services/T00.../B00.../...\nMessage: A new order has arrived. Check the dashboard.',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Store your webhook URL as an Environment Variable (e.g. {{ $vars.SLACK_WEBHOOK }}) so it is not visible in workflow configs.',
          'You can create separate webhook URLs for different channels. Set up one per channel in the Slack app settings at api.slack.com/apps.',
          'If you see a 400 or 404 error, the webhook URL may be wrong or the Slack app may have been removed — regenerate it from the app settings.',
        ],
      },
    ],
  },

  {
    id: 'send-email',
    title: 'Send Email',
    blocks: [
      { type: 'node-header', category: 'Notify' },
      {
        type: 'text',
        content:
          'Sends an email using your own SMTP server or a third-party email service. You provide SMTP credentials — the server address, port, username, and password. Common options include Gmail, SendGrid, Mailgun, and Amazon SES.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Obtain SMTP credentials from your email provider (see the tips section below for step-by-step guides for Gmail, SendGrid, and Mailgun).',
          "Enter the recipient's email address in the To field.",
          'Fill in the Subject and Body of your message.',
          'Enter your SMTP Host, Port, username, password, and the From address that will appear as the sender.',
          'Save and run the workflow — check the execution log to confirm the email was sent.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'To',
            required: true,
            description: "The recipient's email address.",
          },
          {
            name: 'Subject',
            required: true,
            description: 'The email subject line.',
          },
          {
            name: 'Body',
            required: true,
            description: 'The email body as plain text.',
          },
          {
            name: 'SMTP Host',
            required: true,
            description:
              'Your SMTP server address. Examples: smtp.gmail.com, smtp.sendgrid.net, smtp.mailgun.org.',
          },
          {
            name: 'SMTP Port',
            required: true,
            description:
              'The SMTP port number. Use 587 for most providers (STARTTLS). Use 465 for direct SSL/TLS.',
          },
          {
            name: 'SMTP User',
            required: true,
            description:
              'Your SMTP username — usually your email address or an API key identifier.',
          },
          {
            name: 'SMTP Password',
            required: true,
            description:
              'Your SMTP password or API key. Store this as an Environment Variable.',
          },
          {
            name: 'From Address',
            required: true,
            description:
              'The sender address shown to recipients. Can include a display name: Your Name <you@example.com>',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          {
            label: 'Using Gmail with an App Password',
            value:
              'SMTP Host: smtp.gmail.com\nSMTP Port: 587\nSMTP User: you@gmail.com\nSMTP Password: (your 16-character App Password)\nFrom: Your Name <you@gmail.com>',
          },
          {
            label: 'Using SendGrid',
            value:
              'SMTP Host: smtp.sendgrid.net\nSMTP Port: 587\nSMTP User: apikey\nSMTP Password: (your SendGrid API key)\nFrom: you@yourdomain.com',
          },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'Gmail requires an App Password — not your regular password. Go to myaccount.google.com → Security → 2-Step Verification → App passwords. Generate one for Mail and use it as SMTP Password.',
          'SendGrid: create an API key at app.sendgrid.com with Mail Send permission. Use the literal text `apikey` as SMTP User and the API key as SMTP Password.',
          'Mailgun: go to app.mailgun.com → Sending → Domains → your domain → SMTP credentials. Copy the login and password shown there.',
          'Store all SMTP credentials as Environment Variables (e.g. {{ $vars.SMTP_PASS }}) to keep them out of workflow configs.',
        ],
      },
    ],
  },

  {
    id: 'delay',
    title: 'Delay',
    blocks: [
      { type: 'node-header', category: 'Notify' },
      {
        type: 'text',
        content:
          'Pauses the workflow for a set amount of time before continuing to the next node. Use it to wait between steps — for example, wait 30 seconds after creating a record before sending a notification, or pace requests to an external API to avoid rate limits.',
      },
      { type: 'heading', content: 'How to set up' },
      {
        type: 'steps',
        items: [
          'Enter the number of time units to wait in the Duration field.',
          'Choose the unit: seconds, minutes, or hours.',
          'Save the node. When the workflow runs, it will pause at this node for the specified duration before continuing.',
        ],
      },
      { type: 'heading', content: 'Configuration fields' },
      {
        type: 'fields-table',
        fields: [
          {
            name: 'Duration',
            required: true,
            description: 'How long to wait. Enter a positive whole number.',
          },
          {
            name: 'Unit',
            required: true,
            description: 'The unit of time: seconds, minutes, or hours.',
          },
        ],
      },
      { type: 'heading', content: 'Examples' },
      {
        type: 'examples',
        items: [
          { label: 'Wait 30 seconds', value: 'Duration: 30\nUnit: seconds' },
          { label: 'Wait 5 minutes', value: 'Duration: 5\nUnit: minutes' },
        ],
      },
      { type: 'heading', content: 'Tips' },
      {
        type: 'tips',
        items: [
          'The default maximum delay is 5 minutes. Contact your server administrator if you need longer delays.',
          'For very long waits (hours or days), a Schedule Trigger on a second workflow is more reliable than a long Delay.',
        ],
      },
    ],
  },
]
