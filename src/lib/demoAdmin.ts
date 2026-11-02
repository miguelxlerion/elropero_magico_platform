// El acceso demo al panel solo existe donde se activa con estas dos variables.
// Sin ellas DEMO_ADMIN es null y la credencial ni siquiera llega al bundle del cliente.
const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;

export const DEMO_ADMIN = email && password ? { email, password } : null;
