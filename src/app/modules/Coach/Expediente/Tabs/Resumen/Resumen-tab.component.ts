// Resumen-tab.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnChanges,
  SimpleChanges,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ExpedienteService, ProgressSummary } from '../../expediente.service';
import { GestionUser } from '../../../../Suadmin/Gestion/gestion.service';
import { LoaderComponent } from '../../../../../layout/layouts/loader/loader.component';

@Component({
  selector: 'resumen-expediente-tab',
  standalone: true,
  templateUrl: './Resumen-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, LoaderComponent],
})
export class ResumenTabComponent implements OnChanges {
  private svc = inject(ExpedienteService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true })
  alumno!: GestionUser;

  // ── Datos ─────────────────────────────────────────────────────────────────
  summary: ProgressSummary | null = null;
  loading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['alumno'] && this.alumno?.id) {
      this.loadSummary(this.alumno.id);
    }
  }

  // ── Loader ────────────────────────────────────────────────────────────────

  private loadSummary(uid: number) {
    this.loading = true;
    this.svc.getSummary(uid).subscribe({
      next: (r) => {
        this.summary = r.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getChange(val: number | null): string {
    if (val == null) return '—';
    return (val > 0 ? '+' : '') + val.toFixed(1);
  }

  changeClass(val: number | null, invertPositive = false): string {
    if (!val) return 'text-zinc-400';
    return (invertPositive ? val < 0 : val > 0) ? 'text-emerald-500' : 'text-red-500';
  }
}