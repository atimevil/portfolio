# 컴포넌트 구현 패턴

## NavBar — 스크롤 감지 + 모바일 메뉴

```tsx
'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300
      ${scrolled ? 'bg-bg/90 backdrop-blur border-b border-border' : 'bg-transparent'}`}
    >
      {/* 데스크탑 메뉴 */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
      </div>
      {/* 모바일 햄버거 */}
      <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
        {/* 아이콘 */}
      </button>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden flex flex-col"
          >
            {navLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

## ProjectCard — hover 오버레이

```tsx
import Image from 'next/image';
import { ExternalLink, Github } from 'lucide-react';
import type { Project } from '@/types';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border
                    hover:border-accent transition-all duration-300 hover:shadow-xl">
      <div className="relative aspect-video">
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg">{project.title}</h3>
            <p className="text-white/80 text-sm mt-1">{project.description}</p>
            <div className="flex gap-3 mt-3">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                   className="text-white hover:text-accent transition-colors">
                  <Github size={20} />
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                   className="text-white hover:text-accent transition-colors">
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {project.tech.map(t => (
            <span key={t} className="text-xs bg-primary-50 dark:bg-primary-900/30
                                     text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## ContactForm — 상태 관리 + API 연동

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  name:    z.string().min(2, '이름은 2자 이상').max(50),
  email:   z.string().email('올바른 이메일을 입력하세요'),
  message: z.string().min(10, '메시지는 10자 이상').max(1000),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">이름</label>
        <input id="name" {...register('name')}
          className="w-full border border-border rounded-lg px-4 py-2 bg-bg-card" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      {/* email, message 필드 동일 패턴 */}
      <button type="submit" disabled={status === 'loading'}
        className="w-full bg-accent text-white rounded-lg px-6 py-3 font-medium
                   hover:bg-primary-600 transition-colors disabled:opacity-50">
        {status === 'loading' ? '전송 중...' : '메시지 보내기'}
      </button>
      {status === 'success' && <p className="text-green-500">메시지가 전송되었습니다!</p>}
      {status === 'error' && <p className="text-red-500">전송 실패. 다시 시도해주세요.</p>}
    </form>
  );
}
```

## 다크모드 토글 버튼

```tsx
'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  return (
    <button onClick={toggle} aria-label="테마 전환"
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
```
