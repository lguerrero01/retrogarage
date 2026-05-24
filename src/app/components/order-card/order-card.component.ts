import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, User, Phone, MapPin, FileText, Receipt, Settings, Ban, Trash2, ChefHat } from 'lucide-angular';
import { Order } from '../../models/types';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { BillingService } from '../../services/billing.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ComandaModalComponent } from '../comanda-modal/comanda-modal.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ComandaModalComponent],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css']
})
export class OrderCardComponent {
  @Input() order!: Order;
  @Input() waiterMode = false;

  Clock = Clock;
  User = User;
  Phone = Phone;
  MapPin = MapPin;
  FileText = FileText;
  Receipt = Receipt;
  Settings = Settings;
  Ban = Ban;
  Trash2 = Trash2;
  ChefHat = ChefHat;

  isCancelling = false;
  isDeleting = false;
  showComanda = false;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private billingService: BillingService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  get canDeleteCompleted(): boolean {
    return this.order.status === 'completed' && this.authService.hasRole('chef');
  }

  get canCancel(): boolean {
    if (this.waiterMode) {
      return this.order.status === 'pending';
    }
    return (this.order.status === 'pending' || this.order.status === 'preparing')
      && this.authService.hasRole('chef');
  }

  getStatusColor(status: Order['status']): string {
    switch (status) {
      case 'awaiting-payment':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
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
      case 'awaiting-payment':
        return 'Esperando pago';
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
    const messages: Partial<Record<Order['status'], string>> = {
      preparing: 'Preparación iniciada',
      ready: 'Pedido listo para entregar',
      completed: 'Pedido completado'
    };
    const msg = messages[nextStatus];
    if (msg) this.toast.success(msg);
  }

  async cancelOrder() {
    const ok = await this.confirmDialog.confirm({
      title: 'Cancelar pedido',
      message: `¿Cancelar el pedido #${this.order.id.slice(-6)} de ${this.order.customer.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
      danger: true
    });
    if (!ok) return;
    this.isCancelling = true;
    try {
      await this.appService.cancelOrder(this.order.id);
      this.toast.warning(`Pedido #${this.order.id.slice(-6)} cancelado`);
    } catch (err) {
      this.toast.error('Error al cancelar el pedido');
      console.error(err);
    } finally {
      this.isCancelling = false;
    }
  }

  generateInvoice() {
    const invoice = this.billingService.generateInvoice(this.order);
    this.billingService.printInvoice(invoice);
  }

  get canShowComanda(): boolean {
    return this.order.status !== 'awaiting-payment' && this.order.status !== 'cancelled';
  }

  openComanda() {
    this.showComanda = true;
  }

  closeComanda() {
    this.showComanda = false;
  }

  async deleteCompleted() {
    const ok = await this.confirmDialog.confirm({
      title: 'Eliminar pedido',
      message: `¿Eliminar permanentemente el pedido #${this.order.id.slice(-6)} de ${this.order.customer.name}? No se podrá recuperar.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    this.isDeleting = true;
    try {
      await this.appService.deleteArchivedOrder(this.order.id);
      this.toast.success(`Pedido #${this.order.id.slice(-6)} eliminado`);
    } catch (err) {
      this.toast.error('Error al eliminar el pedido');
      console.error(err);
    } finally {
      this.isDeleting = false;
    }
  }
}