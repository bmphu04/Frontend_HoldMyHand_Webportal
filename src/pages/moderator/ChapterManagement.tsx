import { useEffect, useState } from 'react'
import { chaptersApi } from '@/api'
import { MagicCard } from '@/components/ui'
import { BookOpen, Check, Loader2, X } from 'lucide-react'
import { notify } from '@/lib/toast'
import type { Chapter } from '@/types'

export default function ChapterManagement() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    chaptersApi
      .getAll()
      .then(setChapters)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleToggleActive = async (chapter: Chapter) => {
    if (togglingId) return
    const currentActive = chapter.isActive ?? true
    const nextActive = !currentActive

    setTogglingId(chapter.id)
    try {
      // Gọi PUT /api/mod/chapters/:id với { isActive: nextActive }
      const updated = await chaptersApi.update(chapter.id, { isActive: nextActive })

      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapter.id
            ? { ...c, ...(updated && typeof updated === 'object' ? updated : {}), isActive: nextActive }
            : c
        )
      )

      notify.success(
        nextActive
          ? `Đã bật chương "${chapter.name}"`
          : `Đã tắt chương "${chapter.name}"`
      )
    } catch (err: any) {
      console.error(err)
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        'Không thể cập nhật trạng thái chapter'
      notify.error(typeof message === 'string' ? message : 'Không thể cập nhật trạng thái chapter')
    } finally {
      setTogglingId(null)
    }
  }

  const activeCount = chapters.filter((c) => c.isActive !== false).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Chapters</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Danh sách các chapter trong game</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-yellow-400" />
            <span>Tổng: {chapters.length} chương</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Đang bật: {activeCount}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium animate-pulse">
          Đang tải dữ liệu chapter...
        </div>
      ) : chapters.length === 0 ? (
        <MagicCard glowColor="amber" intensity={3} interactive={false} className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Chưa có chapter nào</p>
        </MagicCard>
      ) : (
        <div className="space-y-4">
          {chapters
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((chapter) => {
              const isActive = chapter.isActive !== false
              const isToggling = togglingId === chapter.id

              return (
                <MagicCard
                  key={chapter.id}
                  glowColor={isActive ? 'amber' : 'rose'}
                  intensity={isActive ? 3 : 1}
                  interactive={isActive}
                  className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-300 ${
                    !isActive ? 'opacity-70 bg-slate-950/40 border-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-5 min-w-0 flex-1">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl flex-shrink-0 font-mono transition-colors ${
                        isActive
                          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 text-yellow-400'
                          : 'bg-slate-800/40 border border-slate-700/40 text-slate-500'
                      }`}
                    >
                      {chapter.orderIndex}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3
                          className={`text-lg font-bold tracking-tight truncate ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {chapter.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          {isActive ? 'Đang hoạt động' : 'Tạm tắt'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{chapter.description}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-semibold tracking-wide">
                          Theme: {chapter.theme}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Bật / Tắt Chapter */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-medium text-slate-400">
                      {isActive ? 'Bật' : 'Tắt'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      disabled={isToggling}
                      onClick={() => handleToggleActive(chapter)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isActive
                          ? 'bg-yellow-400 border-yellow-400'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                      title={isActive ? 'Bấm để tắt chapter' : 'Bấm để bật chapter'}
                    >
                      <span className="sr-only">{isActive ? 'Tắt chapter' : 'Bật chapter'}</span>
                      <span
                        className={`pointer-events-none inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />
                        ) : isActive ? (
                          <Check className="h-3.5 w-3.5 text-yellow-400 stroke-[3]" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-slate-500 stroke-[3]" />
                        )}
                      </span>
                    </button>
                  </div>
                </MagicCard>
              )
            })}
        </div>
      )}
    </div>
  )
}
