"use client";

import { useCallback, useState } from "react";
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
import type { GeoSpot } from "~/types/map";
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
  } = useZppiData(fishType);

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
      message: `Bagikan lokasimu secara langsung ke ${userName}? Mereka akan bisa melihat posisposimu di peta.`,
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

  const handleSendSOSFromCardClick = () => {
    if (!myLocation) {
      alert("GPS belum siap");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "DARURAT SOS",
      message:
        "Kirim sinyal bahaya sekarang? Semua nelayan dalam radius 50km akan diberitahu lokasi akurat Anda.",
      confirmText: "KIRIM SOS SEKARANG",
      type: "danger",
      action: async () => {
        const result = await sendSOSAction({
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          message: "Butuh bantuan segera!",
        });
        if (result.success) {
          alert("Sinyal SOS telah dikirim ke seluruh armada terdekat!");
        }
        setSelectedMemberForDetail(null);
      },
    });
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
      />

      {showFishDropdown && (
        <div
          className="absolute inset-0 z-20"
          onClick={() => setShowFishDropdown(false)}
        />
      )}

      {sosAlert && (
        <SOSAlertBanner
          sosAlert={sosAlert}
          onDismiss={() => setSOSAlert(null)}
        />
      )}

      <LayerControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFamilyModal={() => setShowFamilyModal(true)}
        onRecenter={handleRecenter}
      />

      {selectedMemberForDetail && (
        <MemberDetailCard
          member={selectedMemberForDetail}
          isShared={outgoingTargets.has(selectedMemberForDetail.userId)}
          onClose={() => setSelectedMemberForDetail(null)}
          onShare={confirmShareToUser}
          onUnshare={confirmUnshareFromUser}
          onSendSOS={handleSendSOSFromCardClick}
        />
      )}

      <div className="absolute right-0 bottom-[80px] left-0 z-10 flex flex-col gap-2">
        <ActionButtons
          isSharing={isSharing}
          onSendSOS={handleSendSOSFromCardClick}
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
          <div className="mx-3">
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
