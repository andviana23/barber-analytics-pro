import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Dados das paletas
const LIGHT_PALETTE = {
  neutral: [
    {
      name: 'Background',
      hex: '#F9FAFB',
      usage: 'Base da interface',
      class: 'bg-light-bg',
    },
    {
      name: 'Card/Surface',
      hex: '#FFFFFF',
      usage: 'Painéis e seções',
      class: 'bg-light-surface',
    },
    {
      name: 'Borda/Linha',
      hex: '#E2E8F0',
      usage: 'Separadores',
      class: 'border-light-border',
    },
  ],
  text: [
    {
      name: 'Texto Primário',
      hex: '#1E293B',
      usage: 'Alta legibilidade',
      class: 'text-text-light-primary',
    },
    {
      name: 'Texto Secundário',
      hex: '#64748B',
      usage: 'Labels e descrições',
      class: 'text-text-light-secondary',
    },
  ],
  primary: [
    {
      name: 'Azul Primário',
      hex: '#4DA3FF',
      usage: 'Ações e botões',
      class: 'bg-primary',
    },
    {
      name: 'Azul Hover',
      hex: '#1E8CFF',
      usage: 'Realce',
      class: 'bg-primary-hover',
    },
    {
      name: 'Azul Suave',
      hex: '#E8F3FF',
      usage: 'Fundo leve',
      class: 'bg-primary-light',
    },
  ],
  feedback: [
    {
      name: 'Sucesso',
      hex: '#16A34A',
      usage: 'Verde positivo',
      class: 'bg-feedback-light-success',
    },
    {
      name: 'Erro',
      hex: '#EF4444',
      usage: 'Vermelho para alertas',
      class: 'bg-feedback-light-error',
    },
    {
      name: 'Aviso',
      hex: '#F59E0B',
      usage: 'Dourado suave',
      class: 'bg-feedback-light-warning',
    },
  ],
};
const DARK_PALETTE = {
  neutral: [
    {
      name: 'Background',
      hex: '#0C0F12',
      usage: 'Fundo principal',
      class: 'bg-dark-bg',
    },
    {
      name: 'Card/Surface',
      hex: '#161B22',
      usage: 'Containers',
      class: 'bg-dark-surface',
    },
    {
      name: 'Borda/Linha',
      hex: '#242C37',
      usage: 'Divisores',
      class: 'border-dark-border',
    },
  ],
  text: [
    {
      name: 'Texto Primário',
      hex: '#F5F7FA',
      usage: 'Branco suave',
      class: 'text-text-dark-primary',
    },
    {
      name: 'Texto Secundário',
      hex: '#A5AFBE',
      usage: 'Textos complementares',
      class: 'text-text-dark-secondary',
    },
  ],
  primary: [
    {
      name: 'Azul Primário',
      hex: '#4DA3FF',
      usage: 'Azul bebê cromado',
      class: 'bg-primary',
    },
    {
      name: 'Azul Hover',
      hex: '#1E8CFF',
      usage: 'Azul intenso',
      class: 'bg-primary-hover',
    },
    {
      name: 'Azul Suave',
      hex: '#E8F3FF',
      usage: 'Fundo leve',
      class: 'bg-primary-light',
    },
  ],
  feedback: [
    {
      name: 'Sucesso',
      hex: '#3BD671',
      usage: 'Verde vibrante',
      class: 'bg-feedback-dark-success',
    },
    {
      name: 'Erro',
      hex: '#FF7E5F',
      usage: 'Vermelho suave',
      class: 'bg-feedback-dark-error',
    },
    {
      name: 'Aviso',
      hex: '#F4B400',
      usage: 'Amarelo dourado',
      class: 'bg-feedback-dark-warning',
    },
  ],
};

// Componente para exibir uma cor individual
function ColorSwatch({ color, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex);
    onCopy(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="card-theme theme-transition rounded-lg p-4 hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="h-12 w-12 flex-shrink-0 rounded-lg border-2 border-light-border dark:border-dark-border"
          style={{
            backgroundColor: color.hex,
          }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-theme-primary truncate text-sm font-medium">
            {color.name}
          </h3>
          <p className="text-theme-secondary mt-1 text-xs">{color.usage}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <code className="text-theme-primary rounded bg-light-bg px-2 py-1 font-mono text-sm dark:bg-dark-bg">
          {color.hex}
        </code>
        <button
          onClick={handleCopy}
          className="text-theme-secondary theme-transition rounded p-1.5 hover:bg-primary/10 hover:text-primary"
          title="Copiar cor"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// Componente para uma seção de cores
function ColorSection({ title, colors, onCopy }) {
  return (
    <div className="mb-8">
      <h2 className="text-theme-primary mb-4 flex items-center gap-2 text-lg font-semibold">
        {title}
        <span className="text-theme-secondary text-sm font-normal">
          ({colors.length} cores)
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {colors.map((color, index) => (
          <ColorSwatch key={index} color={color} onCopy={onCopy} />
        ))}
      </div>
    </div>
  );
}

// Componente de demonstração prática
function ThemeDemo() {
  return (
    <div className="card-theme mb-8 rounded-xl p-6">
      <h2 className="text-theme-primary mb-6 text-xl font-semibold">
        🎨 Demonstração Prática
      </h2>

      <div className="space-y-6">
        {/* Botões */}
        <div>
          <h3 className="text-theme-primary mb-3 font-medium">Botões</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn-theme-primary rounded-lg px-4 py-2 font-medium">
              Botão Primário
            </button>
            <button className="btn-theme-secondary rounded-lg px-4 py-2 font-medium">
              Botão Secundário
            </button>
            <button className="text-dark-text-primary rounded-lg bg-feedback-light-success px-4 py-2 font-medium dark:bg-feedback-dark-success">
              Sucesso
            </button>
            <button className="text-dark-text-primary rounded-lg bg-feedback-light-error px-4 py-2 font-medium dark:bg-feedback-dark-error">
              Erro
            </button>
          </div>
        </div>

        {/* Cards */}
        <div>
          <h3 className="text-theme-primary mb-3 font-medium">
            Cards e Superfícies
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card-theme rounded-lg p-4">
              <h4 className="text-theme-primary mb-2 font-medium">
                Card de Exemplo
              </h4>
              <p className="text-theme-secondary text-sm">
                Este é um exemplo de como os cards ficam com o tema atual.
              </p>
            </div>
            <div className="card-theme rounded-lg border-l-4 border-primary p-4">
              <h4 className="text-theme-primary mb-2 font-medium">
                Card com Destaque
              </h4>
              <p className="text-theme-secondary text-sm">
                Card com borda de destaque usando a cor primária.
              </p>
            </div>
          </div>
        </div>

        {/* Tipografia */}
        <div>
          <h3 className="text-theme-primary mb-3 font-medium">Tipografia</h3>
          <div className="space-y-2">
            <h1 className="text-theme-primary text-3xl font-bold">
              Título Principal (H1)
            </h1>
            <h2 className="text-theme-primary text-2xl font-semibold">
              Subtítulo (H2)
            </h2>
            <p className="text-theme-primary">
              Texto principal com alta legibilidade
            </p>
            <p className="text-theme-secondary">
              Texto secundário para descrições e labels
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export function PalettePreview() {
  const { actualTheme } = useTheme();
  const [copiedColor, setCopiedColor] = useState('');
  const [showDemo, setShowDemo] = useState(true);
  const currentPalette = actualTheme === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
  const paletteName =
    actualTheme === 'light' ? '☀️ LIGHT MODE' : '🌙 DARK MODE';
  const handleColorCopy = hex => {
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(''), 3000);
  };
  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-theme-primary mb-2 text-3xl font-bold">
            Barber Analytics Pro - Paleta de Cores
          </h1>
          <p className="text-theme-secondary">
            Tema atual: <span className="font-medium">{paletteName}</span>
          </p>
        </div>

        <button
          onClick={() => setShowDemo(!showDemo)}
          className="btn-theme-secondary flex items-center gap-2 rounded-lg px-4 py-2 font-medium"
        >
          {showDemo ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showDemo ? 'Ocultar Demo' : 'Mostrar Demo'}
        </button>
      </div>

      {/* Notificação de cópia */}
      {copiedColor && (
        <div className="card-theme fixed right-4 top-4 z-50 rounded-lg border-l-4 border-primary p-3 shadow-lg">
          <p className="text-theme-primary text-sm font-medium">
            Cor copiada: <code className="font-mono">{copiedColor}</code>
          </p>
        </div>
      )}

      {/* Demonstração Prática */}
      {showDemo && <ThemeDemo />}

      {/* Paleta de Cores */}
      <div className="space-y-8">
        <ColorSection
          title="🎨 Cores Neutras"
          colors={currentPalette.neutral}
          onCopy={handleColorCopy}
        />

        <ColorSection
          title="📝 Cores de Texto"
          colors={currentPalette.text}
          onCopy={handleColorCopy}
        />

        <ColorSection
          title="🚀 Cores Primárias"
          colors={currentPalette.primary}
          onCopy={handleColorCopy}
        />

        <ColorSection
          title="💬 Cores de Feedback"
          colors={currentPalette.feedback}
          onCopy={handleColorCopy}
        />
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-light-border pt-8 dark:border-dark-border">
        <p className="text-theme-secondary text-center text-sm">
          🎨 Sistema de Design - Barber Analytics Pro © 2025
          <br />
          Desenvolvido com React, Tailwind CSS e Lucide Icons
        </p>
      </div>
    </div>
  );
}
