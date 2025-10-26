import { MenuItem } from '../models/types';

export const menuItems: MenuItem[] = [
  // Entradas
  {
    id: '1',
    name: 'Nachos Supremos',
    description: 'Tortilla chips con queso fundido, jalapeños, guacamole y crema',
    price: 12.99,
    category: 'Entradas',
    image: 'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '2',
    name: 'Alitas BBQ',
    description: '8 alitas de pollo con salsa BBQ casera y aderezo ranch',
    price: 15.99,
    category: 'Entradas',
    image: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '3',
    name: 'Quesadillas de Pollo',
    description: 'Tortillas de harina con pollo desmenuzado y queso oaxaca',
    price: 11.99,
    category: 'Entradas',
    image: 'https://images.pexels.com/photos/6605791/pexels-photo-6605791.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  
  // Platos Principales
  {
    id: '4',
    name: 'Hamburguesa Clásica',
    description: 'Carne de res 200g con ingredientes frescos y papas fritas',
    price: 18.99,
    category: 'Platos Principales',
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    customizable: true,
    ingredients: ['Carne de res 200g', 'Pan brioche', 'Lechuga', 'Tomate', 'Cebolla', 'Queso cheddar', 'Pepinillos', 'Salsa especial', 'Papas fritas']
  },
  {
    id: '5',
    name: 'Tacos al Pastor',
    description: '4 tacos de carne al pastor con piña, cebolla y cilantro',
    price: 16.99,
    category: 'Platos Principales',
    image: 'https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '6',
    name: 'Pasta Alfredo con Pollo',
    description: 'Fettuccine en salsa alfredo cremosa con pechuga de pollo grillada',
    price: 22.99,
    category: 'Platos Principales',
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '7',
    name: 'Salmón a la Plancha',
    description: 'Filete de salmón con vegetales al vapor y arroz pilaf',
    price: 26.99,
    category: 'Platos Principales',
    image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '8',
    name: 'Hamburguesa BBQ',
    description: 'Hamburguesa con salsa BBQ, aros de cebolla y tocino',
    price: 21.99,
    category: 'Platos Principales',
    image: 'https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    customizable: true,
    ingredients: ['Carne de res 200g', 'Pan brioche', 'Salsa BBQ', 'Aros de cebolla', 'Tocino', 'Queso cheddar', 'Lechuga', 'Tomate', 'Papas fritas']
  },
  
  // Bebidas
  {
    id: '9',
    name: 'Limonada Natural',
    description: 'Limonada fresca con menta y hielo',
    price: 4.99,
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/1438674/pexels-photo-1438674.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '10',
    name: 'Café Americano',
    description: 'Café negro recién molido',
    price: 3.99,
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '11',
    name: 'Jugo de Naranja',
    description: 'Jugo natural de naranja recién exprimido',
    price: 5.99,
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  
  // Postres
  {
    id: '12',
    name: 'Cheesecake de Fresa',
    description: 'Pastel de queso cremoso con salsa de fresas naturales',
    price: 8.99,
    category: 'Postres',
    image: 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: '13',
    name: 'Brownie con Helado',
    description: 'Brownie de chocolate caliente con helado de vainilla',
    price: 7.99,
    category: 'Postres',
    image: 'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  }
];