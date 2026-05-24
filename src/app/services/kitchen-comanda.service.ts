import { Injectable } from '@angular/core';
import { Order, CartItem } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class KitchenComandaService {

  private readonly RESTAURANT_NAME = 'Retro Garage';

  generateComandaHtml(order: Order, opts: { autoPrint?: boolean } = {}): string {
    const autoPrint = opts.autoPrint ?? false;
    const ts = new Date(order.timestamp);
    const fecha = ts.toLocaleDateString('es-ES');
    const hora = ts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const tipo = this.formatOrderType(order.orderType);
    const totalUnidades = order.items.reduce((acc, it) => acc + it.quantity, 0);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comanda #${order.id.slice(-6)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 8px 10px;
      width: 80mm;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .big { font-size: 16px; }
    .xl { font-size: 20px; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .double-sep { border-top: 2px solid #000; margin: 6px 0; }
    .header { margin-bottom: 4px; }
    .meta { font-size: 11px; line-height: 1.4; }
    .meta-row { display: flex; justify-content: space-between; }
    .item { margin: 6px 0; }
    .item-line { display: flex; align-items: flex-start; }
    .item-qty {
      min-width: 28px;
      font-weight: bold;
      font-size: 14px;
    }
    .item-name {
      flex: 1;
      font-weight: bold;
      font-size: 13px;
      text-transform: uppercase;
      word-wrap: break-word;
    }
    .item-mod {
      margin-left: 28px;
      font-size: 11px;
      font-style: italic;
    }
    .item-mod.add { color: #000; }
    .item-mod.rm  { color: #000; text-decoration: line-through; }
    .notes-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin-top: 4px;
      font-size: 11px;
    }
    .footer {
      margin-top: 8px;
      font-size: 10px;
      text-align: center;
    }
    @media print {
      body { padding: 0 4mm; }
    }
  </style>
</head>
<body>
  <div class="header center">
    <div class="bold big">${this.escape(this.RESTAURANT_NAME)}</div>
    <div class="bold">COMANDA DE COCINA</div>
  </div>
  <div class="double-sep"></div>

  <div class="meta">
    <div class="meta-row"><span class="bold">Pedido:</span><span class="bold xl">#${order.id.slice(-6)}</span></div>
    <div class="meta-row"><span>Fecha:</span><span>${fecha}</span></div>
    <div class="meta-row"><span>Hora:</span><span>${hora}</span></div>
    <div class="meta-row"><span>Tipo:</span><span class="bold">${tipo}</span></div>
    <div class="meta-row"><span>Cliente:</span><span>${this.escape(order.customer.name || '-')}</span></div>
    ${order.customer.table ? `<div class="meta-row"><span>Mesa:</span><span class="bold">${this.escape(order.customer.table)}</span></div>` : ''}
    ${order.customer.phone ? `<div class="meta-row"><span>Tel:</span><span>${this.escape(order.customer.phone)}</span></div>` : ''}
  </div>

  <div class="sep"></div>
  <div class="bold center">ARTICULOS (${totalUnidades})</div>
  <div class="sep"></div>

  ${order.items.map(item => this.renderItem(item)).join('')}

  ${order.customer.notes ? `
    <div class="sep"></div>
    <div class="bold">NOTAS DEL PEDIDO:</div>
    <div class="notes-box">${this.escape(order.customer.notes)}</div>
  ` : ''}

  <div class="double-sep"></div>
  <div class="footer">
    Impreso: ${new Date().toLocaleString('es-ES')}<br>
    -- ${this.escape(this.RESTAURANT_NAME)} --
  </div>

  ${autoPrint ? `
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });
  </script>
  ` : ''}
</body>
</html>`;
  }

  printComanda(order: Order): void {
    const html = this.generateComandaHtml(order, { autoPrint: true });
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) {
      console.warn('No se pudo abrir la ventana de impresión (popup bloqueado).');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  private renderItem(item: CartItem): string {
    const adds = item.selectedIngredients?.length
      ? `<div class="item-mod add">+ ${item.selectedIngredients.map(i => this.escape(i)).join(', ')}</div>`
      : '';
    const removes = item.removedIngredients?.length
      ? `<div class="item-mod rm">SIN: ${item.removedIngredients.map(i => this.escape(i)).join(', ')}</div>`
      : '';
    return `
      <div class="item">
        <div class="item-line">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${this.escape(item.name)}</span>
        </div>
        ${adds}
        ${removes}
      </div>
    `;
  }

  private formatOrderType(type?: Order['orderType']): string {
    switch (type) {
      case 'dine-in-customer':
      case 'dine-in-staff':
        return 'EN MESA';
      case 'delivery':
        return 'A DOMICILIO';
      default:
        return 'EN LOCAL';
    }
  }

  private escape(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
