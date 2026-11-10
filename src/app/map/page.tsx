"use client";

import { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "../_components/Navbar";
import { useSession } from "next-auth/react";
import { useFleetTracking, type FleetMember } from "~/hooks/useFleetTracking";
import {
  sendSOSAction,
  getActiveSharelockUsersAction,
} from "~/lib/actions/location";
import FamilyContactModal from "../_components/FamilyContactModal";
import type { ConfirmDialogState, FishType, ViewMode } from "~/types/type";
import { useGeoLocation } from "~/hooks/useGeoLocation";
import { useZppiData } from "~/hooks/useZppiData";
import { calculateDistance } from "~/types/utils";
import type { GeoSpot, RescueTarget } from "~/types/map";
import TopBar from "../_components/TopBar";
import { baseOrigin } from "~/types/constants";
import SOSAlertBanner from "../_components/SOSAlertBanner";
import LayerControls from "../_components/LayerControls";
import MemberDetailCard from "../_components/MemberDetailCard";
import ActionButtons from "../_components/ActionButtons";
import BottomSheetCollapsed from "../_components/BottomSheetCollapsed";
import BottomSheetExpanded from "../_components/BottomSheetExpanded";
import ActiveUsersModal from "../_components/ActiveUsersModal";
import ConfirmDialog from "../_components/ConfirmDialog";
import OfflineHubModal from "../_components/OfflineHubModal";
import EmergencyHubModal from "../_components/EmergencyHubModal";
import {
  getCustomWaypoints,
  type LocalWaypoint,
} from "~/lib/offline-storage";

const FishingMap = dynamic(() => import("../_components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <p className="animate-pulse text-sm font-medium tracking-wide text-slate-500">
        Menyiapkan Sistem Navigasi...
      </p>
    </div>
  ),
});

export default function Map() {
  const [viewMode, setViewMode] = useState<ViewMode>("zppi");
  const [fishType, setFishType] = useState<FishType>("umum");
  const [showDetail, setShowDetail] = useState(false);
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const { data: session } = useSession();

  const [isSharing, setIsSharing] = useState(false);
  const [sosAlert, setSOSAlert] = useState<FleetMember | null>(null);
  const [, setActiveSharedMemberId] = useState<string | null>(null);

  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedMemberForDetail, setSelectedMemberForDetail] =
    useState<FleetMember | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );

  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [rescueTarget, setRescueTarget] = useState<RescueTarget | null>(null);
  const [customWaypoints, setCustomWaypoints] = useState<LocalWaypoint[]>([]);

  const { userLocation, gpsActive } = useGeoLocation();

  const {
    zppiSpots,
    loading,
    selectedSpot,
    setSelectedSpot,
    sheetExpanded,
    setSheetExpanded,
    topSpot,
    topSpots,
    isOfflineData,
  } = useZppiData(fishType);

  // Muat waypoint offline dari IndexedDB
  const refreshWaypoints = useCallback(async () => {
    try {
      const wp = await getCustomWaypoints();
      setCustomWaypoints(wp);
    } catch (err) {
      console.warn("Gagal membaca waypoint:", err);
    }
  }, []);

  useEffect(() => {
    void refreshWaypoints();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("emergency") === "true" ||
        params.get("sos") === "true"
      ) {
        setShowEmergencyModal(true);
      }
      if (params.get("offline") === "true") {
        setShowOfflineModal(true);
      }
    }
  }, [refreshWaypoints]);

  const distance =
    selectedSpot && userLocation
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          selectedSpot.lat,
          selectedSpot.lng,
        )
      : 0;
  const traditionalFuel = selectedSpot ? Math.round(distance * 1.5 + 8) : 0;
  const zppiFuel = selectedSpot ? Math.round(distance * 1.05) : 0;
  const fuelSavingPercent =
    traditionalFuel > 0
      ? Math.round(((traditionalFuel - zppiFuel) / traditionalFuel) * 100)
      : 0;

  const handleSpotSelect = useCallback(
    (spot: GeoSpot) => {
      setSelectedSpot(spot);
      setSheetExpanded(true);
      setShowDetail(false);
    },
    [setSelectedSpot, setSheetExpanded],
  );

  const handleRecenter = () => setRecenterTrigger((n) => n + 1);

  const handleSOSReceived = useCallback((member: FleetMember) => {
    setSOSAlert(member);
    setTimeout(() => setSOSAlert(null), 30000);
  }, []);

  const {
    fleetMembers,
    myLocation,
    toggleSharing,
    outgoingTargets,
    sharelockToUser,
    unsharelockFromUser,
  } = useFleetTracking({
    isSharing,
    myUserId: session?.user?.id,
    onSOSReceived: handleSOSReceived,
  });

  const fetchActiveUsers = async () => {
    const res = await getActiveSharelockUsersAction();
    if (res.success) {
      setActiveUsersList(res.data);
    } else {
      alert("Gagal mengambil daftar nelayan");
    }
  };

  const handleToggleSharingClick = async () => {
    if (!isSharing) {
      setConfirmDialog({
        isOpen: true,
        title: "Aktifkan Sharelock?",
        message:
          "Anda akan masuk ke lobi dan bisa melihat nelayan lain. Nelayan lain belum bisa melihat Anda sampai Anda membagikannya.",
        confirmText: "Ya, Masuk Lobi",
        type: "success",
        action: async () => {
          setIsSharing(true);
          await toggleSharing(true);
          await fetchActiveUsers();
          setShowActiveUsersModal(true);

          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
          }
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Masuk Mode Siluman?",
        message:
          "Matikan Sharelock? Anda tidak akan bisa melihat nelayan lain, dan nelayan lain tidak bisa melihat Anda.",
        confirmText: "Ya, Matikan",
        type: "danger",
        action: async () => {
          setIsSharing(false);
          await toggleSharing(false);
          setShowActiveUsersModal(false);
          setSelectedMemberForDetail(null);
        },
      });
    }
  };

  const confirmShareToUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Bagikan Lokasi?",
      message: `Bagikan lokasimu secara langsung ke ${userName}? Mereka akan bisa melihat posisimu di peta.`,
      confirmText: "Bagikan",
      type: "success",
      action: async () => {
        await sharelockToUser(userId);
      },
    });
  };

  const confirmUnshareFromUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cabut Akses Lokasi?",
      message: `Berhenti membagikan lokasi ke ${userName}? Mereka tidak akan bisa lagi melihat posisimu.`,
      confirmText: "Cabut Akses",
      type: "danger",
      action: async () => {
        await unsharelockFromUser(userId);
        setSelectedMemberForDetail(null);
      },
    });
  };

  const handleOpenEmergencyHub = () => {
    setShowEmergencyModal(true);
  };

  const handleMapMemberSelect = (memberId: string | null) => {
    setActiveSharedMemberId(memberId);
    if (memberId) {
      const member = fleetMembers.find((m) => m.userId === memberId) ?? null;
      setSelectedMemberForDetail(member);
    } else {
      setSelectedMemberForDetail(null);
    }
  };

  const handleStartRescueNavigation = (
    lat: number,
    lng: number,
    name: string,
  ) => {
    setRescueTarget({
      lat,
      lng,
      title: name,
    });
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-slate-900 select-none"
      style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
    >
      <div className="absolute inset-0 z-0">
        <FishingMap
          viewMode={viewMode}
          selectedSpot={selectedSpot}
          onSpotSelect={handleSpotSelect}
          fishType={fishType}
          baseOrigin={baseOrigin}
          userLocation={userLocation}
          recenterTrigger={recenterTrigger}
          fleetMembers={fleetMembers}
          myLocation={myLocation}
          selectedMemberId={selectedMemberForDetail?.userId ?? null}
          onSelectMember={handleMapMemberSelect}
          customWaypoints={customWaypoints}
          rescueTarget={rescueTarget}
          onClearRescueRoute={() => setRescueTarget(null)}
        />
      </div>

      <TopBar
        gpsActive={gpsActive}
        fishType={fishType}
        onFishTypeChange={(value) => {
          setFishType(value);
          setShowFishDropdown(false);
        }}
        showFishDropdown={showFishDropdown}
        onToggleFishDropdown={() => setShowFishDropdown((v) => !v)}
        isOffline={isOfflineData || isSimulatedOffline}
        onOpenOfflineModal={() => setShowOfflineModal(true)}
        onOpenEmergencyModal={handleOpenEmergencyHub}
        activeEmergencyCount={fleetMembers.filter((m) => m.isSOS).length}
      />

      {showFishDropdown && (
        <div
          className="absolute inset-0 z-20"
          onClick={() => setShowFishDropdown(false)}
        />
      )}

      {/* Banner Sinyal SOS Darurat Masuk */}
      {sosAlert && (
        <SOSAlertBanner
          sosAlert={sosAlert}
          onDismiss={() => setSOSAlert(null)}
          onStartRescue={handleStartRescueNavigation}
        />
      )}

      <LayerControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFamilyModal={() => setShowFamilyModal(true)}
        onRecenter={handleRecenter}
      />

      {/* Kartu Detail Anggota Armada / Nelayan SOS */}
      {selectedMemberForDetail && (
        <MemberDetailCard
          member={selectedMemberForDetail}
          isShared={outgoingTargets.has(selectedMemberForDetail.userId)}
          onClose={() => setSelectedMemberForDetail(null)}
          onShare={confirmShareToUser}
          onUnshare={confirmUnshareFromUser}
          onSendSOS={handleOpenEmergencyHub}
          onStartRescueNavigation={handleStartRescueNavigation}
        />
      )}

      <div className="absolute right-0 bottom-[68px] left-0 z-10 flex flex-col gap-1.5">
        <ActionButtons
          isSharing={isSharing}
          onSendSOS={handleOpenEmergencyHub}
          onToggleSharing={handleToggleSharingClick}
        />

        {!sheetExpanded ? (
          <BottomSheetCollapsed
            topSpot={topSpot}
            loading={loading}
            zppiSpots={zppiSpots}
            userLocation={userLocation}
            distance={distance}
            fuelSavingPercent={fuelSavingPercent}
            onExpand={() => setSheetExpanded(true)}
          />
        ) : (
          <div className="mx-2.5">
            <BottomSheetExpanded
              selectedSpot={selectedSpot}
              loading={loading}
              gpsActive={gpsActive}
              userLocation={userLocation}
              distance={distance}
              traditionalFuel={traditionalFuel}
              zppiFuel={zppiFuel}
              fuelSavingPercent={fuelSavingPercent}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail((v) => !v)}
              topSpots={topSpots}
              onSelectSpot={setSelectedSpot}
              onCollapse={() => {
                setSheetExpanded(false);
                setShowDetail(false);
              }}
            />
          </div>
        )}
      </div>

      <Navbar />

      <FamilyContactModal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        userLat={userLocation?.lat}
        userLng={userLocation?.lng}
      />

      {showActiveUsersModal && (
        <ActiveUsersModal
          activeUsersList={activeUsersList}
          outgoingTargets={outgoingTargets}
          onClose={() => setShowActiveUsersModal(false)}
          onShare={confirmShareToUser}
          onUnshare={confirmUnshareFromUser}
        />
      )}

      {/* Modal Pusat Navigasi & Caching Peta Offline */}
      <OfflineHubModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        userLat={userLocation?.lat}
        userLng={userLocation?.lng}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={setIsSimulatedOffline}
        onSelectWaypoint={(wp) => {
          setSelectedSpot({
            lat: wp.lat,
            lng: wp.lng,
            value: 99,
          });
          setRecenterTrigger((n) => n + 1);
        }}
        onRefreshMapData={() => void refreshWaypoints()}
      />

      {/* Modal Pusat Keselamatan & Laporan Darurat Komunitas & Posko */}
      <EmergencyHubModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        userLat={userLocation?.lat ?? -6.465}
        userLng={userLocation?.lng ?? 108.452}
        userName={session?.user?.name ?? "Nelayan"}
        isSimulatedOffline={isSimulatedOffline}
        onFocusSOSOnMap={(targetLat, targetLng, victimName) => {
          setRescueTarget({
            lat: targetLat,
            lng: targetLng,
            title: victimName,
          });
          setRecenterTrigger((n) => n + 1);
        }}
      />

      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={async () => {
            await confirmDialog.action();
            setConfirmDialog(null);
          }}
        />
      )}
    </main>
  );
}
