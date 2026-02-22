import { useState } from "react";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "@/shared/components/ui/card.js";
import { Input } from "@/shared/components/ui/Input.js";
import { Label } from "@/shared/components/ui/Label.js";
import { Button } from "@/shared/components/ui/button.js";
import { Badge } from "@/shared/components/ui/badge.js";
import { useUpdateProfile } from "../hooks/useUpdateProfile.js";
import type { UserProfile } from "../types/user-profile.types.js";

interface PersonalInfoCardProps {
  /** Datos del perfil del usuario autenticado */
  profile: UserProfile;
}

/**
 * Tarjeta de información personal del usuario.
 * Permite visualizar y actualizar el nombre. El email es solo lectura.
 */
export const PersonalInfoCard = ({ profile }: PersonalInfoCardProps) => {
  const [name, setName] = useState(profile.name);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }

    updateProfile(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success("Perfil actualizado correctamente.");
        },
        onError: () => {
          toast.error("No se pudo actualizar el perfil. Inténtalo de nuevo.");
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-lg">Información Personal</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo: Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nombre</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
            />
          </div>

          {/* Campo: Email (solo lectura) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="profile-email">Email</Label>
              {profile.isGoogleUser && (
                <Badge variant="secondary" className="text-xs">
                  ⊙ Google
                </Badge>
              )}
            </div>
            <Input
              id="profile-email"
              value={profile.email}
              disabled
              readOnly
              className="cursor-not-allowed opacity-70"
            />
          </div>

          {/* Botón de guardado */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Actualizando..." : "Actualizar perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
