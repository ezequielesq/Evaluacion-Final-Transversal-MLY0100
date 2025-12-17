import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DemoSamplesService } from '../../services/sample.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {

  healthStatus: any;

  // JSON editable
  selectedSample: number[] | null = null;
  editableJson = '';

  // Resultado
  prediction: any;
  probability: number | null = null;

  loading = false;
  error: string | null = null;

  constructor(
    private api: ApiService,
    private demoSamples: DemoSamplesService
  ) {}

  ngOnInit(): void {
    this.api.healthCheck().subscribe({
      next: res => this.healthStatus = res,
      error: () => this.healthStatus = { status: 'error' }
    });
  }

  // 1️⃣ Selección automática
  loadDemoSample() {
    this.selectedSample = this.demoSamples.getRandomSample();
    this.editableJson = JSON.stringify(this.selectedSample, null, 2);
    this.prediction = null;
    this.probability = null;
    this.error = null;
  }

  // 2️⃣ Enviar JSON (editable)
  sendPrediction() {
    this.loading = true;
    this.error = null;
    this.prediction = null;
    this.probability = null;

    try {
      const parsed = JSON.parse(this.editableJson);

      if (!Array.isArray(parsed)) {
        throw new Error('El JSON debe ser un array de números');
      }

      this.api.predict(parsed).subscribe({
        next: res => {
          this.prediction = res;
          this.probability = res.probabilidad;
          this.loading = false;
        },
        error: () => {
          this.error = 'Error al consumir la API de predicción';
          this.loading = false;
        }
      });

    } catch (e) {
      this.error = 'JSON inválido. Verifica el formato.';
      this.loading = false;
    }
  }

  // Semáforo
  getRiskLabel(): string {
    if (this.probability === null) return '';
    if (this.probability < 0.3) return 'Bajo';
    if (this.probability < 0.6) return 'Medio';
    return 'Alto';
  }

  getRiskColor(): string {
    if (this.probability === null) return '';
    if (this.probability < 0.3) return 'w3-green';
    if (this.probability < 0.6) return 'w3-yellow';
    return 'w3-red';
  }
}
