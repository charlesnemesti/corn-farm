"use client";

import { LOGIN_COPY } from "@/lib/loginConfig";
import { LAUNCH_COPY } from "@/lib/launchConfig";

type LoginModePanelProps = {
  awaitingWallet: boolean;
  connecting: boolean;
  walletModeEnabled: boolean;
  onSelectDemo: () => void;
  onSelectWallet: () => void;
  onConnectWallet: () => void;
  onBack: () => void;
};

function ModeCard({
  accent,
  icon,
  title,
  description,
  cta,
  onClick,
  disabled,
  locked,
}: {
  accent: "demo" | "wallet";
  icon: string;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || locked}
      className={`login-mode-card login-mode-card--${accent}${locked ? " login-mode-card--locked" : ""}`}
    >
      <span className="login-mode-card__shine" aria-hidden />
      <span className="login-mode-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="login-mode-card__body">
        <span className="login-mode-card__title">{title}</span>
        <span className="login-mode-card__desc">{description}</span>
      </span>
      <span className="login-mode-card__cta">
        {cta}
        <span className="login-mode-card__arrow" aria-hidden>
          →
        </span>
      </span>
    </button>
  );
}

export function LoginModePanel({
  awaitingWallet,
  connecting,
  walletModeEnabled,
  onSelectDemo,
  onSelectWallet,
  onConnectWallet,
  onBack,
}: LoginModePanelProps) {
  return (
    <div
      className="login-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-panel-title"
    >
      <div className="login-panel__rim" aria-hidden />
      <div className="login-panel__glow" aria-hidden />

      <div className="login-panel__header">
        <p className="login-panel__eyebrow">
          {awaitingWallet ? "Step 2 of 2" : "Step 1 of 2"}
        </p>
        <h2 id="login-panel-title" className="login-panel__title">
          {awaitingWallet ? LOGIN_COPY.walletTitle : LOGIN_COPY.panelTitle}
        </h2>
        <p className="login-panel__subtitle">
          {awaitingWallet ? LOGIN_COPY.walletSubtitle : LOGIN_COPY.panelSubtitle}
        </p>
      </div>

      <div
        className={`login-panel__body ${awaitingWallet ? "login-panel__body--wallet" : "login-panel__body--select"}`}
      >
        {awaitingWallet ? (
          <div className="login-panel__wallet-step">
            <button
              type="button"
              onClick={onConnectWallet}
              disabled={connecting}
              className="login-primary-btn"
            >
              <span className="login-primary-btn__shine" aria-hidden />
              {connecting ? LOGIN_COPY.connectingCta : LOGIN_COPY.connectCta}
            </button>

            <div className="login-panel__secondary-actions">
              <button
                type="button"
                onClick={onSelectDemo}
                className="login-ghost-btn"
              >
                {LOGIN_COPY.switchToDemo}
              </button>
              <button type="button" onClick={onBack} className="login-ghost-btn">
                {LOGIN_COPY.backToSelect}
              </button>
            </div>
          </div>
        ) : (
          <>
            {!walletModeEnabled ? (
              <div
                className="login-panel__launch-notice"
                role="status"
                aria-live="polite"
              >
                <p className="login-panel__launch-notice-title">
                  {LAUNCH_COPY.walletModeBlockedTitle}
                </p>
                <p className="login-panel__launch-notice-body">
                  {LAUNCH_COPY.walletModeBlockedBody}
                </p>
              </div>
            ) : null}

            <div className="login-panel__mode-grid">
              <ModeCard
                accent="demo"
                icon="▶"
                title={LOGIN_COPY.demoTitle}
                description={LOGIN_COPY.demoDescription}
                cta={LOGIN_COPY.demoCta}
                onClick={onSelectDemo}
              />
              <ModeCard
                accent="wallet"
                icon="◎"
                title={LOGIN_COPY.walletCardTitle}
                description={LOGIN_COPY.walletCardDescription}
                cta={
                  walletModeEnabled
                    ? "Connect"
                    : LAUNCH_COPY.walletCardLockedCta
                }
                onClick={onSelectWallet}
                disabled={!walletModeEnabled}
                locked={!walletModeEnabled}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
