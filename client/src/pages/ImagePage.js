import React, { useState } from 'react';
import { Image, Download, RefreshCw, Sparkles, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STYLES = [
  { id: '', label: 'None' },
  { id: 'realistic photo', label: 'Realistic' },
  { id: 'anime style', label: 'Anime' },
  { id: 'oil painting', label: 'Oil Painting' },
  { id: 'watercolor art', label: 'Watercolor' },
  { id: 'digital art', label: 'Digital Art' },
  { id: 'pencil sketch', label: 'Pencil Sketch' },
  { id: 'cinematic photography', label: 'Cinematic' },
  { id: '3d render', label: '3D Render' },
];

const SIZES = [
  { id: '512x512', label: 'Square', w: 512, h: 512 },
  { id: '768x512', label: 'Landscape', w: 768, h: 512 },
  { id: '512x768', label: 'Portrait', w: 512, h: 768 },
];

const EXAMPLES = [
  'A futuristic city at night with neon lights',
  'A dragon flying over snow-capped mountains',
  'A cozy coffee shop in the rain',
  'An astronaut walking on Mars at sunset',
  'A magical forest with glowing fireflies',
  'A samurai in cherry blossom rain',
];

function buildImageUrl(promptText, style, w, h, seed) {
  const full = style ? `${promptText}, ${style}` : promptText;
  const params = new URLSearchParams({
    prompt: full,
    width: w,
    height: h,
    seed: seed,
  });
  return `http://localhost:5000/api/files/image-proxy?${params.toString()}`;
}

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic photo');
  const [size, setSize] = useState('512x512');
  const [count, setCount] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const generateImages = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    setLoading(true);
    const selectedSize = SIZES.find(s => s.id === size);
    const newImages = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 99999999);
      newImages.push({
        id: `${Date.now()}-${i}`,
        url: buildImageUrl(prompt.trim(), style, selectedSize.w, selectedSize.h, seed),
        prompt: prompt.trim(),
        style,
        size,
        w: selectedSize.w,
        h: selectedSize.h,
        seed,
        status: 'loading',
      });
    }
    setImages(prev => [...newImages, ...prev]);
    setLoading(false);
    toast.success('Generating... please wait 30–60 seconds');
  };

  const onLoad = (id) =>
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, status: 'done' } : img
    ));

  const onError = (id) => {
  setTimeout(() => {
    setImages(prev => prev.map(img =>
      img.id === id && img.status !== 'done'
        ? { ...img, status: 'error' }
        : img
    ));
  }, 90000);
};

  const regenerate = (img) => {
    const seed = Math.floor(Math.random() * 99999999);
    const selectedSize = SIZES.find(s => s.id === img.size);
    const newUrl = buildImageUrl(img.prompt, img.style, selectedSize.w, selectedSize.h, seed);
    setImages(prev => prev.map(i =>
      i.id === img.id ? { ...i, url: newUrl, seed, status: 'loading' } : i
    ));
    toast.success('Trying again...');
  };

  const download = (img) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.target = '_blank';
    a.click();
    toast.success('Opening in new tab — right-click to save');
  };

  const remove = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (lightbox?.id === id) setLightbox(null);
  };

  const activeBtn = {
    background: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(168,85,247,0.55)',
    color: '#c084fc',
  };

  const inactiveBtn = {
    background: 'var(--nexus-bg)',
    borderColor: 'var(--nexus-border)',
    color: 'var(--nexus-muted)',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'rgba(139,92,246,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Image style={{ width: 22, height: 22, color: '#a855f7' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--nexus-text)', margin: 0 }}>
            AI Image Generator
          </h1>
          <p style={{ fontSize: 13, color: 'var(--nexus-muted)', margin: 0 }}>
            Free · unlimited · no API key needed
          </p>
        </div>
      </div>

      {/* Input card */}
      <div style={{
        background: 'var(--nexus-surface)',
        border: '1px solid var(--nexus-border)',
        borderRadius: 20,
        padding: '20px 22px',
        marginBottom: 24,
      }}>

        {/* Prompt textarea */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 8 }}>
          Describe your image
        </p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) generateImages(); }}
          placeholder="A tiger walking through a neon-lit jungle at midnight..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--nexus-border)',
            background: 'var(--nexus-bg)',
            color: 'var(--nexus-text)',
            fontSize: 14,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: 11, color: 'var(--nexus-muted)', marginTop: 4, marginBottom: 14 }}>
          Ctrl + Enter to generate quickly
        </p>

        {/* Examples */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 8 }}>
          Examples
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12,
                border: '1px solid var(--nexus-border)',
                background: 'var(--nexus-bg)',
                color: 'var(--nexus-muted)', cursor: 'pointer',
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Style */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 8 }}>
          Art style
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12,
                fontWeight: 500, border: '1px solid', cursor: 'pointer',
                transition: 'all 0.15s',
                ...(style === s.id ? activeBtn : inactiveBtn),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Size + Count + Button */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 8 }}>
              Size
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {SIZES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: 12,
                    fontWeight: 500, border: '1px solid', cursor: 'pointer',
                    ...(size === s.id ? activeBtn : inactiveBtn),
                  }}
                >
                  {s.label} <span style={{ opacity: 0.45, fontSize: 10 }}>{s.w}×{s.h}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nexus-muted)', marginBottom: 8 }}>
              Count
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    width: 40, padding: '6px 0', borderRadius: 10,
                    fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer',
                    textAlign: 'center',
                    ...(count === n ? activeBtn : inactiveBtn),
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateImages}
            disabled={loading || !prompt.trim()}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 28px', borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              color: '#fff', border: 'none', cursor: 'pointer',
              opacity: prompt.trim() ? 1 : 0.4,
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles style={{ width: 16, height: 16 }} />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Images grid */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {images.map(img => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid var(--nexus-border)',
                background: 'var(--nexus-surface)',
                minHeight: 280,
              }}
            >
              {/* Loading spinner */}
              {img.status === 'loading' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'var(--nexus-surface)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '3px solid rgba(168,85,247,0.2)',
                    borderTopColor: '#a855f7',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: 13, color: 'var(--nexus-text)', margin: 0 }}>Generating...</p>
                  <p style={{ fontSize: 11, color: 'var(--nexus-muted)', margin: 0 }}>30–60 seconds</p>
                </div>
              )}

              {/* Error state */}
              {img.status === 'error' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'var(--nexus-surface)',
                }}>
                  <AlertCircle style={{ width: 36, height: 36, color: '#f87171' }} />
                  <p style={{ fontSize: 13, color: 'var(--nexus-muted)', margin: 0 }}>Failed to load</p>
                  <button
                    onClick={() => regenerate(img)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 18px', borderRadius: 10,
                      fontSize: 13, fontWeight: 500,
                      color: '#fff', border: 'none', cursor: 'pointer',
                      background: 'rgba(168,85,247,0.8)',
                    }}
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    Try Again
                  </button>
                </div>
              )}

              {/* Image */}
              <img
  src={img.url}
  alt={img.prompt}
  onLoad={() => onLoad(img.id)}
  onError={() => onError(img.id)}
  onClick={() => img.status === 'done' && setLightbox(img)}
  loading="eager"
  decoding="async"
  style={{
                  width: '100%',
                  display: 'block',
                  minHeight: 280,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  opacity: img.status === 'done' ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />

              {/* Action buttons on hover */}
              {img.status === 'done' && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  display: 'flex', gap: 6,
                }}>
                  <button
                    onClick={() => regenerate(img)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <RefreshCw style={{ width: 14, height: 14, color: '#fff' }} />
                  </button>
                  <button
                    onClick={() => download(img)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <Download style={{ width: 14, height: 14, color: '#fff' }} />
                  </button>
                  <button
                    onClick={() => remove(img.id)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.6)',
                    }}
                  >
                    <X style={{ width: 14, height: 14, color: '#fff' }} />
                  </button>
                </div>
              )}

              {/* Prompt label */}
              {img.status === 'done' && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '24px 12px 10px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                }}>
                  <p style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.8)',
                    margin: 0, lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {img.prompt}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            margin: '0 auto 16px',
            background: 'rgba(139,92,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image style={{ width: 28, height: 28, color: '#a855f7' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--nexus-text)', margin: '0 0 6px' }}>
            No images yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--nexus-muted)', margin: 0 }}>
            Type a description above and click Generate Image
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 800, width: '100%' }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.prompt}
              style={{ width: '100%', borderRadius: 16, display: 'block' }}
            />
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => download(lightbox)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.15)',
                }}
              >
                <Download style={{ width: 16, height: 16, color: '#fff' }} />
              </button>
              <button
                onClick={() => setLightbox(null)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.15)',
                }}
              >
                <X style={{ width: 16, height: 16, color: '#fff' }} />
              </button>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '32px 16px 14px', borderRadius: '0 0 16px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '0 0 4px' }}>
                {lightbox.prompt}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {lightbox.w} × {lightbox.h} · seed {lightbox.seed}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}