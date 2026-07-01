import {
  Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ExpedienteComponent } from '../Expediente/expediente.component';
import { ClientGymGroup, GestionUser, RolesService } from '../../Suadmin/Gestion/gestion.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'coach-alumnos',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './coach-alumnos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachAlumnosComponent implements OnInit {
  private rolesService = inject(RolesService);
  private authService  = inject(AuthService);
  private cdr          = inject(ChangeDetectorRef);

  loading = true;
  clientes: GestionUser[] = [];
  selectedClient: GestionUser | null = null;

get coachId(): number {
  return Number(this.authService.getUser()?.id) ?? 0;
}

  ngOnInit() {
    this.rolesService.getUsers().subscribe({
      next: (r) => {
        this.clientes = (r.clients ?? []).flatMap((g: ClientGymGroup) => g.users);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectClient(client: GestionUser) {
    this.selectedClient = client;
    this.cdr.markForCheck();
  }

  back() {
    this.selectedClient = null;
    this.cdr.markForCheck();
  }
}