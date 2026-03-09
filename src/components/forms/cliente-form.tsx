"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { clienteSchema, ClienteFormValues } from "@/lib/validations/cliente"

interface ClienteFormProps {
  initialId?: number | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ initialId, onSuccess, onCancel }: ClienteFormProps) {
  const isEditing = !!initialId

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: "",
      apPaterno: "",
      apMaterno: "",
      telefono: "",
      correo: "",
    },
  })

  useEffect(() => {
    if (!initialId) {
      form.reset({ nombre: "", apPaterno: "", apMaterno: "", telefono: "", correo: "" })
      return
    }

    fetch(`/api/clientes/${initialId}`)
      .then((r) => r.json())
      .then((data) => {
        form.reset({
          nombre: data.nombre ?? "",
          apPaterno: data.apPaterno ?? "",
          apMaterno: data.apMaterno ?? "",
          telefono: data.telefono ?? "",
          correo: data.correo ?? "",
        })
      })
      .catch(() => toast.error("Error al cargar los datos del cliente"))
  }, [initialId, form])

  const onSubmit = async (values: ClienteFormValues) => {
    const url = isEditing ? `/api/clientes/${initialId}` : "/api/clientes"
    const method = isEditing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "Error en la operación")
      return
    }

    toast.success(
      isEditing ? "Cliente actualizado correctamente" : "Cliente registrado correctamente"
    )
    form.reset()
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apPaterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido Paterno</FormLabel>
                <FormControl>
                  <Input placeholder="García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apMaterno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Apellido Materno{" "}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="López" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="70123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Correo{" "}
                  <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="juan@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEditing
                ? "Guardando..."
                : "Registrando..."
              : isEditing
                ? "Guardar Cambios"
                : "Registrar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
