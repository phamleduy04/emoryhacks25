import { useAuth0 } from '@auth0/auth0-react';
import { useConvexAuth } from 'convex/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { loginWithRedirect, logout, user } = useAuth0();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        {isLoading ? (
          <CardContent className="flex items-center justify-center p-12">
            Loading...
          </CardContent>
        ) : !isAuthenticated ? (
          <>
            <CardHeader className="text-center">
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Sign in to continue</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => loginWithRedirect()} size="lg">
                Login
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>Hello {user?.name || user?.email || 'User'}</CardTitle>
              <CardDescription>You are signed in</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                variant="outline"
              >
                Logout
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
