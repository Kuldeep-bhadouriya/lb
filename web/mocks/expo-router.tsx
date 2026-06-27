import React, { useEffect, createContext, useContext } from "react";
import { useNavigate, useLocation, useParams, useSearchParams, Outlet } from "react-router-dom";
import { useTheme } from "../../theme/ThemeContext";

// Resolve paths like "../auth/login" or "../../ride/tracking" into absolute web paths
export function resolvePath(path: string) {
  if (!path) return "/";
  let clean = path;
  if (clean.startsWith("../")) {
    clean = "/" + clean.replace(/\.\.\//g, "");
  } else if (clean.startsWith("./")) {
    clean = "/" + clean.replace(/\.\//g, "");
  }
  // Normalize double slashes
  clean = clean.replace(/\/+/g, "/");
  return clean;
}

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (target: any) => {
      if (typeof target === "object" && target.pathname) {
        const dest = resolvePath(target.pathname);
        const searchParams = new URLSearchParams();
        if (target.params) {
          Object.keys(target.params).forEach((key) => {
            if (target.params[key] !== undefined && target.params[key] !== null) {
              searchParams.append(key, String(target.params[key]));
            }
          });
        }
        const qs = searchParams.toString();
        navigate(dest + (qs ? `?${qs}` : ""));
      } else {
        navigate(resolvePath(target));
      }
    },
    replace: (target: any) => {
      if (typeof target === "object" && target.pathname) {
        const dest = resolvePath(target.pathname);
        const searchParams = new URLSearchParams();
        if (target.params) {
          Object.keys(target.params).forEach((key) => {
            if (target.params[key] !== undefined && target.params[key] !== null) {
              searchParams.append(key, String(target.params[key]));
            }
          });
        }
        const qs = searchParams.toString();
        navigate(dest + (qs ? `?${qs}` : ""), { replace: true });
      } else {
        navigate(resolvePath(target), { replace: true });
      }
    },
    back: () => {
      navigate(-1);
    },
  };
}

export function useLocalSearchParams() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const searchObj: Record<string, string> = {};

  searchParams.forEach((val, key) => {
    searchObj[key] = val;
  });

  return { ...params, ...searchObj };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useFocusEffect(effect: () => void) {
  useEffect(() => {
    effect();
  }, []);
}

export function Link({ href, children, style, ...props }: any) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      style={{ cursor: "pointer", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Stack({ children }: any) {
  return <Outlet />;
}

Stack.Screen = function StackScreen() {
  return null;
};

export function Slot() {
  return <Outlet />;
}

export function Tabs({ children, screenOptions }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();

  // Extract config from child Screens
  const screens = React.Children.toArray(children)
    .filter((c: any) => c.type === Tabs.Screen)
    .map((c: any) => ({
      name: c.props.name,
      title: c.props.options?.title || c.props.name,
      tabBarIcon: c.props.options?.tabBarIcon,
    }));

  const activeTab = location.pathname.split("/").pop() || "passenger";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundColor: colors.background,
      }}
    >
      {/* Header Panel */}
      <div
        style={{
          height: "56px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {screenOptions?.headerTitle ? screenOptions.headerTitle() : null}
      </div>

      {/* Screen Outlet */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <Outlet />
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          height: "64px",
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          backgroundColor: colors.background,
          flexShrink: 0,
          paddingBottom: "6px",
          zIndex: 10,
        }}
      >
        {screens.map((screen) => {
          const isActive = activeTab === screen.name;
          const activeColor = colors.primary;
          const inactiveColor = theme === "dark" ? "#aaa" : "#666";
          const color = isActive ? activeColor : inactiveColor;

          return (
            <div
              key={screen.name}
              onClick={() => navigate(`/home/${screen.name}`)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                gap: "4px",
                transition: "all 0.2s ease",
              }}
            >
              {screen.tabBarIcon ? screen.tabBarIcon({ color, size: 22 }) : null}
              <span
                style={{
                  fontSize: "11px",
                  color,
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                {screen.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Tabs.Screen = function TabsScreen() {
  return null;
};
export { Tabs as TabBar };
