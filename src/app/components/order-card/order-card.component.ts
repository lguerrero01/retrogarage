import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, User, Phone, MapPin, FileText, Receipt, Settings } from 'lucide-angular';
import { Order } from '../../models/types';
import { AppService } from '../../services/app.service';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css']
})
export class OrderCardComponent {
  @Input() order!: Order;
  
  Clock = Clock;
  User = User;
  Phone = Phone;
  MapPin = MapPin;
  FileText = FileText;
  Receipt = Receipt;
  Settings = Settings;

  constructor(
    private appService: AppService,
    private billingService: BillingService
  ) {}

  getStatusColor(status: Order['status']): string {
    switch (status) {
      case 'pending':
        return 'bg-[#fac20a] text-[#2a23b8]';
      case 'preparing':
        return 'bg-[#ed450d] text-white';
      case 'ready':
        return 'bg-[#8624ce] text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  getStatusText(status: Order['status']): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getNextStatus(currentStatus: Order['status']): Order['status'] {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return currentStatus;
    }
  }

  canAdvanceStatus(status: Order['status']): boolean {
    return status !== 'completed' && status !== 'cancelled';
  }

  getButtonText(status: Order['status']): string {
    switch (status) {
      case 'pending':
        return 'Comenzar Preparación';
      case 'preparing':
        return 'Marcar como Listo';
      case 'ready':
        return 'Completar Pedido';
      default:
        return '';
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  advanceStatus() {
    const nextStatus = this.getNextStatus(this.order.status);
    this.appService.updateOrderStatus(this.order.id, nextStatus);
  }

  generateInvoice() {
    const invoice = this.billingService.generateInvoice(this.order);
    this.billingService.printInvoice(invoice);
  }
}