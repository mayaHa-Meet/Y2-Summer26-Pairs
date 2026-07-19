import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { LocalMessage } from '../hooks/useChat'

type Props = {
  message: LocalMessage
  accent: string
  accentSoft: string
  agentName: string
}

// Talia wraps code in [<code>] brackets per her system prompt. Render those
// segments as syntax-highlighted code blocks even outside markdown fences.
function renderTaliaCodeBlocks(text: string) {
  const out: React.ReactNode[] = []
  let key = 0
  let cursor = 0
  const open = text.indexOf('[')
  if (open === -1) return text
  const close = text.indexOf(']', open)
  if (close === -1) return text

  if (open > 0) out.push(<span key={key++}>{text.slice(0, open)}</span>)
  const code = text.slice(open + 1, close)
  out.push(
    <pre key={key++} className="message__code">
      <SyntaxHighlighter language="python" style={oneDark} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </pre>,
  )
  if (close + 1 < text.length) out.push(<span key={key++}>{text.slice(close + 1)}</span>)
  void cursor
  return out
}

export function MessageBubble({ message, accent, accentSoft, agentName }: Props) {
  const isUser = message.role === 'user'

  const markdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      if (!inline && match) {
        return (
          <SyntaxHighlighter
            language={match[1]}
            style={oneDark}
            PreTag="div"
            className="message__code"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'}`}>
      {!isUser && (
        <div className="message__avatar" style={{ background: accent }}>
          {agentName[0]}
        </div>
      )}
      <div
        className="message__bubble"
        style={
          isUser
            ? { background: accent, color: '#fff' }
            : { background: accentSoft, border: `1px solid ${accent}33` }
        }
      >
        {isUser ? (
          <p className="message__text">{message.content}</p>
        ) : message.pending ? (
          <TypingDots accent={accent} />
        ) : (
          <div className="message__text markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {message.content.includes('[') && message.content.includes(']') && (
              <div className="message__talia-code">{renderTaliaCodeBlocks(message.content)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingDots({ accent }: { accent: string }) {
  return (
    <div className="typing" aria-label="Agent is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing__dot"
          style={{ animationDelay: `${i * 0.15}s`, background: accent }}
        />
      ))}
    </div>
  )
}
