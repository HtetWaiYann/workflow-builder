import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocBlock } from '@/components/documentation/DocBlock'
import type { ContentBlock } from '@/types/docs'

// Renders a single content block for the documentation page.
// Each block type maps to a distinct HTML structure.
describe('DocBlock', () => {
  describe('text block', () => {
    it('renders plain text content in a paragraph', () => {
      const block: ContentBlock = { type: 'text', content: 'Hello world' }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('renders **bold** markers as <strong> elements', () => {
      const block: ContentBlock = {
        type: 'text',
        content: '**important** note',
      }
      const { container } = render(<DocBlock block={block} />)
      expect(container.querySelector('strong')).toHaveTextContent('important')
    })

    it('renders `backtick` markers as inline <code> elements', () => {
      const block: ContentBlock = {
        type: 'text',
        content: 'run `npm install` first',
      }
      const { container } = render(<DocBlock block={block} />)
      expect(container.querySelector('code')).toHaveTextContent('npm install')
    })
  })

  describe('heading block', () => {
    it('renders content inside an h3 element', () => {
      const block: ContentBlock = { type: 'heading', content: 'Section Title' }
      render(<DocBlock block={block} />)
      expect(
        screen.getByRole('heading', { level: 3, name: 'Section Title' })
      ).toBeInTheDocument()
    })
  })

  describe('code-block', () => {
    it('renders content inside a pre > code structure', () => {
      const block: ContentBlock = {
        type: 'code-block',
        content: 'const x = 1',
      }
      const { container } = render(<DocBlock block={block} />)
      expect(container.querySelector('pre code')).toHaveTextContent(
        'const x = 1'
      )
    })
  })

  describe('note block', () => {
    it('renders the note content', () => {
      const block: ContentBlock = {
        type: 'note',
        content: 'This is an important note',
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('This is an important note')).toBeInTheDocument()
    })
  })

  describe('steps block', () => {
    it('renders items in an ordered list', () => {
      const block: ContentBlock = {
        type: 'steps',
        items: ['First step', 'Second step'],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('First step')).toBeInTheDocument()
      expect(screen.getByText('Second step')).toBeInTheDocument()
      expect(screen.getByRole('list').tagName).toBe('OL')
    })

    it('applies the start attribute when provided', () => {
      const block: ContentBlock = {
        type: 'steps',
        items: ['Continued step'],
        start: 3,
      }
      const { container } = render(<DocBlock block={block} />)
      expect(container.querySelector('ol')).toHaveAttribute('start', '3')
    })
  })

  describe('bullet-list block', () => {
    it('renders items in an unordered list', () => {
      const block: ContentBlock = {
        type: 'bullet-list',
        items: ['Item A', 'Item B'],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Item A')).toBeInTheDocument()
      expect(screen.getByRole('list').tagName).toBe('UL')
    })
  })

  describe('table block', () => {
    it('renders column headers and cell values', () => {
      const block: ContentBlock = {
        type: 'table',
        headers: ['Name', 'Type'],
        rows: [['timeout', 'number']],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('timeout')).toBeInTheDocument()
      expect(screen.getByText('number')).toBeInTheDocument()
    })
  })

  describe('fields-table block', () => {
    it('renders field names and their descriptions', () => {
      const block: ContentBlock = {
        type: 'fields-table',
        fields: [
          { name: 'url', required: true, description: 'The endpoint URL' },
          { name: 'method', required: false, description: 'HTTP method' },
        ],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('url')).toBeInTheDocument()
      expect(screen.getByText('The endpoint URL')).toBeInTheDocument()
      expect(screen.getByText('method')).toBeInTheDocument()
      expect(screen.getByText('HTTP method')).toBeInTheDocument()
    })

    it('shows the required-field footnote when at least one field is required', () => {
      const block: ContentBlock = {
        type: 'fields-table',
        fields: [{ name: 'url', required: true, description: 'URL' }],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Required field')).toBeInTheDocument()
    })

    it('omits the required-field footnote when no field is required', () => {
      const block: ContentBlock = {
        type: 'fields-table',
        fields: [{ name: 'label', required: false, description: 'A label' }],
      }
      render(<DocBlock block={block} />)
      expect(screen.queryByText('Required field')).not.toBeInTheDocument()
    })
  })

  describe('examples block', () => {
    it('renders each example label and value', () => {
      const block: ContentBlock = {
        type: 'examples',
        items: [{ label: 'Basic usage', value: '{"key":"val"}' }],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Basic usage')).toBeInTheDocument()
      expect(screen.getByText('{"key":"val"}')).toBeInTheDocument()
    })
  })

  describe('tips block', () => {
    it('renders a "Helpful tips" heading and each tip', () => {
      const block: ContentBlock = {
        type: 'tips',
        items: ['Tip one', 'Tip two'],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('Helpful tips')).toBeInTheDocument()
      expect(screen.getByText('Tip one')).toBeInTheDocument()
      expect(screen.getByText('Tip two')).toBeInTheDocument()
    })
  })

  describe('intro-cards block', () => {
    it('renders each card with its step number, title, and description', () => {
      const block: ContentBlock = {
        type: 'intro-cards',
        cards: [{ step: '1', title: 'Build', desc: 'Start building here' }],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Build')).toBeInTheDocument()
      expect(screen.getByText('Start building here')).toBeInTheDocument()
    })
  })

  describe('env-vars-list block', () => {
    it('renders each env var key and description', () => {
      const block: ContentBlock = {
        type: 'env-vars-list',
        items: [{ key: 'DATABASE_URL', desc: 'PostgreSQL connection string' }],
      }
      render(<DocBlock block={block} />)
      expect(screen.getByText('DATABASE_URL')).toBeInTheDocument()
      expect(
        screen.getByText('PostgreSQL connection string')
      ).toBeInTheDocument()
    })
  })
})
