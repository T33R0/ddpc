"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Logo } from "@repo/ui/logo";
import { useRouter } from "next/navigation";
import { useTheme } from "../lib/theme-context";
import { useAuth } from "../lib/auth";
import { toUsernameSlug } from "../lib/user-routing";

interface DashboardNode {
  id: number;
  title: string;
  route: string;
  description: string;
  icon: React.ElementType;
  category: string;
  relatedIds: number[];
  status: "available" | "featured" | "new";
  color: string;
}

interface DDPCDashboardOrbitalProps {
  nodes: DashboardNode[];
}

export default function DDPCDashboardOrbital({
  nodes,
}: DDPCDashboardOrbitalProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [containerSize, setContainerSize] = useState<number>(800);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user, profile } = useAuth();
  const usernameSlug = profile?.username ? toUsernameSlug(profile.username) : null;

  // Determine theme colors
  const glowColor = resolvedTheme === 'dark' ? 'shadow-[0_0_20px_#22c55e]' : 'shadow-[0_0_20px_#3b82f6]';
  const ringColor = resolvedTheme === 'dark' ? 'border-green-500' : 'border-blue-500';
  const pingColor = resolvedTheme === 'dark' ? 'border-green-500/50' : 'border-blue-500/50';
  const bgColor = resolvedTheme === 'dark' ? 'bg-black' : 'bg-white';
  const iconColor = resolvedTheme === 'dark' ? 'text-white' : 'text-black';

  // Node text colors
  const nodeTextColor = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const nodeTextActiveColor = resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900';

  // Card colors for light theme
  const cardBg = resolvedTheme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95';
  const cardBorder = resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200';
  const cardText = resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardDesc = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const cardGlow = resolvedTheme === 'dark' ? '' : 'shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-200';

  // Admin check logic
  const isAdmin = profile?.role === 'admin';
  const isBreakGlassUser = user?.email === 'myddpc@gmail.com';
  const canAccessAdmin = isAdmin || isBreakGlassUser;

  // Responsive calculations
  const isMobile = containerSize < 600;
  const radius = isMobile ? containerSize * 0.35 : 250;
  const logoSize = isMobile ? 100 : 150;
  const logoIconSize = isMobile ? 60 : 100;
  const nodeSize = isMobile ? 50 : 75;
  const nodeIconSize = isMobile ? 24 : 40;
  const nodeTextTop = isMobile ? 60 : 90;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerSize(width);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Also use ResizeObserver for more robust size tracking
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  const buildScopedRoute = useCallback(
    (path: string) => {
      if (!path) return path;
      const normalized = path.startsWith("/") ? path : `/${path}`;
      if (!usernameSlug) {
        return normalized;
      }
      if (normalized === "/") {
        return `/${usernameSlug}`;
      }
      return `/${usernameSlug}${normalized}`;
    },
    [usernameSlug]
  );

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canAccessAdmin) {
      router.push(buildScopedRoute('/admin'));
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = nodes.findIndex((item) => item.id === nodeId);
    const totalNodes = nodes.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;

    // Center is (0,0) in the transform context
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = 1;

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = nodes.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  return (
    <div
      className="w-full max-w-[800px] aspect-square flex flex-col items-center justify-center relative mx-auto"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
          }}
        >
          {/* DDPC Logo Center */}
          <div
            className={`absolute rounded-full border-2 ${bgColor} ${ringColor} ${glowColor} flex items-center justify-center z-10 transition-colors duration-300 ${canAccessAdmin ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{ width: logoSize, height: logoSize }}
            onClick={handleLogoClick}
          >
            <div className={iconColor}>
              <Logo size={logoIconSize} />
            </div>
            <div
              className={`absolute rounded-full border ${pingColor} animate-ping opacity-50`}
              style={{ width: logoSize + 20, height: logoSize + 20 }}
            ></div>
          </div>

          {nodes.map((node, index) => {
            const position = calculateNodePosition(index, nodes.length);
            const isExpanded = expandedItems[node.id];
            const isRelated = isRelatedToActive(node.id);
            const isPulsing = pulseEffect[node.id];
            const Icon = node.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
              willChange: "transform", // Hint to browser for optimization to reduce softening
              backfaceVisibility: "hidden" as const, // Improve rendering crispness
            };

            return (
              <div
                key={node.id}
                ref={(el) => { nodeRefs.current[node.id] = el; }}
                className="absolute transition-transform duration-300 cursor-pointer hover:scale-110"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(node.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""
                    }`}
                  style={{
                    background: `radial-gradient(circle, ${node.color}20 0%, transparent 70%)`,
                    width: nodeSize + 20,
                    height: nodeSize + 20,
                    left: -10,
                    top: -10,
                  }}
                ></div>

                <div
                  className={`
                  rounded-full flex items-center justify-center
                  ${isExpanded ? "text-black" : "text-white"}
                  border-2
                  ${isExpanded ? "border-white shadow-lg shadow-white/20" : "border-gray-600"}
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-125" : ""}
                  ${isRelated ? "animate-pulse border-white/60" : ""}
                `}
                  style={{
                    backgroundColor: isExpanded ? 'white' : node.color,
                    width: nodeSize,
                    height: nodeSize,
                    // Ensuring crisp borders
                    boxShadow: isExpanded ? '0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                  }}
                >
                  <Icon size={nodeIconSize} />
                </div>

                <div
                  className={`
                  absolute whitespace-nowrap
                  font-semibold tracking-wider
                  transition-all duration-300
                  left-1/2 -translate-x-1/2
                  ${isExpanded ? nodeTextActiveColor + " scale-110" : nodeTextColor}
                `}
                  style={{
                    top: nodeTextTop,
                    fontSize: isMobile ? '0.875rem' : '1.125rem',
                    // Subpixel antialiasing for text
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale"
                  }}
                >
                  {node.title.toLowerCase()}
                </div>

                {isExpanded && (
                  <Card
                    className={`absolute left-1/2 -translate-x-1/2 ${isMobile ? 'w-64' : 'w-72'} ${cardBg} backdrop-blur-lg ${cardBorder} ${cardGlow} shadow-xl overflow-visible`}
                    style={{ top: nodeTextTop + 30 }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gray-500"></div>

                    {/* Scrutineer Coming Soon Badge - overlaying modal */}
                    {node.title === "Scrutineer" && (
                      <div className="absolute -top-3 -right-3 z-50">
                        <Badge
                          className="px-3 py-1 text-sm font-bold animate-pulse shadow-[0_0_10px_theme(colors.green.500)] border-green-400 text-green-400 bg-black/80 dark:text-green-400 dark:border-green-400 dark:shadow-[0_0_10px_theme(colors.green.500)] light:text-blue-500 light:border-blue-500 light:shadow-[0_0_10px_theme(colors.blue.500)]"
                        >
                          Coming Soon
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className={`text-lg ${cardText} text-center`}>
                        {node.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={`text-sm ${cardDesc} text-center pb-4`}>
                      <p className="mb-4 leading-relaxed">{node.description}</p>

                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 border-gray-600 bg-transparent hover:bg-gray-800 hover:text-white transition-all ${cardDesc}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(buildScopedRoute(node.route));
                          }}
                        >
                          Visit Page
                          <ArrowRight size={14} className="ml-2" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(node.id);
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
