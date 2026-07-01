// foto-viewer-modal.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Assessment } from '../../../../Coach/Expediente/expediente.service';


type PhotoKey = 'front' | 'back' | 'left_side' | 'right_side';

@Component({
  selector: 'coach-foto-viewer-modal',
  standalone: true,
  templateUrl: './foto-viewer-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
})
export class FotoViewerModalComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input() isOpen = false;
  @Input() assessment: Assessment | null = null;
  @Input() activeKey: PhotoKey = 'front';
  @Input() photoPositions: { key: PhotoKey; label: string }[] = [];

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() closed = new EventEmitter<void>();
  @Output() keyChange = new EventEmitter<PhotoKey>();
  @Output() editRequested = new EventEmitter<PhotoKey>();
  @Output() deleteRequested = new EventEmitter<PhotoKey>();

  @HostListener('document:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent) {
    if (!this.isOpen) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  }

  get currentPhoto(): string | null {
    if (!this.assessment) return null;
    return this.assessment.photos?.[this.activeKey] ?? null;
  }

  get currentLabel(): string {
    return this.photoPositions.find((p) => p.key === this.activeKey)?.label ?? '';
  }

  get currentIndex(): number {
    return this.photoPositions.findIndex((p) => p.key === this.activeKey);
  }

  selectKey(key: PhotoKey) {
    this.activeKey = key;
    this.keyChange.emit(key);
  }

  next() {
    if (!this.photoPositions.length) return;
    const i = (this.currentIndex + 1) % this.photoPositions.length;
    this.selectKey(this.photoPositions[i].key);
  }

  prev() {
    if (!this.photoPositions.length) return;
    const i = (this.currentIndex - 1 + this.photoPositions.length) % this.photoPositions.length;
    this.selectKey(this.photoPositions[i].key);
  }

  edit() {
    this.editRequested.emit(this.activeKey);
  }

  remove() {
    this.deleteRequested.emit(this.activeKey);
  }

  close() {
    this.closed.emit();
  }
}
