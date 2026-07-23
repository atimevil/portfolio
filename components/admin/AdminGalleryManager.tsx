'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import type { GalleryImage } from '@/types'

interface AdminGalleryManagerProps {
  initialImages: GalleryImage[]
}

export default function AdminGalleryManager({ initialImages }: AdminGalleryManagerProps) {
  const [images, setImages] = useState(initialImages)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleCancel() {
    setSelectedFile(null)
    setPreview(null)
    setCategory('')
    setDescription('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('category', category || '기타')
    formData.append('description', description)
    const res = await fetch('/api/gallery', { method: 'POST', body: formData })
    if (res.ok) {
      const image = await res.json()
      setImages((prev) => [image, ...prev])
      handleCancel()
    } else {
      alert('업로드 실패')
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch('/api/gallery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">갤러리 관리</h1>

      {/* 업로드 영역 */}
      <div className="bg-bg-secondary border border-border rounded-xl p-5 mb-6">
        {!selectedFile ? (
          /* 파일 선택 */
          <div
            className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-text-secondary text-sm">클릭하여 이미지 선택</p>
            <p className="text-xs text-text-muted mt-1">JPG, PNG, GIF, WebP</p>
          </div>
        ) : (
          /* 선택된 파일 미리보기 + 폼 */
          <div className="flex gap-5 items-start">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="미리보기" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <p className="text-xs text-text-muted truncate">{selectedFile.name}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">카테고리</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="카테고리 입력"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">설명</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="이미지 설명"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-bg text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
                <Button variant="secondary" onClick={handleCancel} disabled={uploading}>
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* 이미지 목록 */}
      {images.length === 0 ? (
        <p className="text-center text-text-secondary py-10">이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-surface">
                <Image
                  src={`/uploads/gallery/${image.filename}`}
                  alt={image.description}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => handleDelete(image.id)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                삭제
              </button>
              {image.category && (
                <p className="text-xs text-text-muted mt-1 truncate">{image.category}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
