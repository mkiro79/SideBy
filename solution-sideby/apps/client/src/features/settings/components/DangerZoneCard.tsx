import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog.js";
import { Button } from "@/shared/components/ui/button.js";
import { useLogout } from "@/features/auth/hooks/useLogout.js";
import { useDeleteAccount } from "../hooks/useDeleteAccount.js";

/**
 * Tarjeta de zona de peligro.
 * Permite al usuario eliminar su cuenta de forma permanente, con confirmación.
 */
export const DangerZoneCard = () => {
  const { mutate: deleteAccount, isPending } = useDeleteAccount();
  const logout = useLogout();

  const handleDeleteAccount = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        toast.success("Cuenta eliminada. ¡Hasta luego!");
        logout();
      },
      onError: () => {
        toast.error("No se pudo eliminar la cuenta. Inténtalo de nuevo.");
      },
    });
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
      {/* Encabezado de zona de peligro */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-red-800 dark:text-red-300">Zona de Peligro</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            Acciones irreversibles sobre tu cuenta
          </p>
        </div>
      </div>

      {/* Fila: Eliminar cuenta */}
      <div className="rounded-lg border border-red-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dark:border-red-900/40 dark:bg-transparent">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
          <p className="text-xs text-muted-foreground">
            Elimina permanentemente tu cuenta y todos tus datasets.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="shrink-0">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar cuenta
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es <strong>irreversible</strong>. Se eliminarán tu cuenta y todos tus
                datasets permanentemente. No podrás recuperar tu información.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar mi cuenta"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
