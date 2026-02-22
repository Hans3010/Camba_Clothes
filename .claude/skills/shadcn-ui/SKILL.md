---
name: shadcn-ui
description: "shadcn/ui component patterns for CambaClothes. Use when building any UI: forms, tables, modals, dialogs, buttons, cards, navigation, dropdowns, or any visual component."
---

## Installation
Components are installed individually via CLI:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
# etc.
```
Installed components go to `components/ui/`. NEVER edit files in `components/ui/` directly.

## Essential Components for This Project
Install these first:
```bash
npx shadcn-ui@latest add button input label card table badge dialog sheet form select command separator dropdown-menu avatar toast sonner tabs skeleton alert popover calendar
```

## Forms Pattern
ALL forms must use react-hook-form + zod + shadcn Form:
```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
});

type FormValues = z.infer<typeof formSchema>;

export function ProductoForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: "", precio: 0 },
  });

  async function onSubmit(values: FormValues) {
    // API call
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nombre" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
```

## Data Tables Pattern
ALL list views must use @tanstack/react-table with shadcn DataTable:
- Define columns in a separate file: `components/tables/productos-columns.tsx`
- Use the DataTable component from shadcn docs
- Include: sorting, filtering, pagination
- Action column with dropdown menu (Edit, Delete/Deactivate)

## Modals/Dialogs
- Use `Dialog` for create/edit forms (opens over the page)
- Use `Sheet` for side panels (filters, details)
- Use `AlertDialog` for confirmations (delete, annul)
- Modals should be controlled via state, not via URL

## Notifications
Use Sonner for all toast notifications:
```typescript
import { toast } from "sonner";
toast.success("Producto creado exitosamente");
toast.error("Error al crear el producto");
```

## Status Badges
```typescript
<Badge variant={estado === "ACTIVO" ? "default" : "secondary"}>
  {estado}
</Badge>
```
- ACTIVO → green (default variant)
- INACTIVO → gray (secondary variant)
- ANULADO → red (destructive variant)
- COMPLETADA → green (default variant)

## Dashboard KPI Cards
Use `Card` component for each KPI:
```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">Bs. 1,234.00</div>
    <p className="text-xs text-muted-foreground">+20% vs ayer</p>
  </CardContent>
</Card>
```

## Icons
Use `lucide-react` for all icons (already included with shadcn).

## Layout
- Sidebar: Use a custom component with navigation links, collapsible
- Header: User avatar with dropdown (profile, logout)
- Main content: Responsive padding with `p-6`
- Use `cn()` utility from `@/lib/utils` for conditional classes
