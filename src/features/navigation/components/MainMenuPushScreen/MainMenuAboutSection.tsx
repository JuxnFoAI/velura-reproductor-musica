/** Sección Acerca de dentro de Ajustes. */

import { logoUrl } from '@assets'
import {
  APP_DESCRIPTION,
  APP_FEATURES,
  APP_LEGAL_NOTICE,
  APP_NAME,
  APP_PRIVACY_NOTICE,
  APP_VERSION,
  getAppRuntimeLabel,
} from '@lib/appInfo'

const COPYRIGHT_YEAR = new Date().getFullYear()

/**
 * Muestra la información pública del reproductor: versión, funciones y avisos de privacidad.
 */
export function MainMenuAboutSection() {
  return (
    <section
      className="main-menu-about-section main-menu-screen__scroll player-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
      aria-label="Acerca de"
    >
      <header className="main-menu-about-section__hero">
        <img
          className="main-menu-about-section__logo"
          src={logoUrl}
          alt=""
          width={72}
          height={72}
          draggable={false}
        />
        <h2 className="main-menu-about-section__title bebas-neue-regular">{APP_NAME}</h2>
        <p className="main-menu-about-section__version montserrat-regular">
          Versión {APP_VERSION}
        </p>
      </header>

      <p className="main-menu-about-section__description montserrat-regular">{APP_DESCRIPTION}</p>

      <div className="main-menu-about-section__group">
        <h3 className="main-menu-about-section__heading bebas-neue-regular">Características</h3>
        <ul className="main-menu-about-section__list montserrat-regular">
          {APP_FEATURES.map((feature) => (
            <li key={feature} className="main-menu-about-section__list-item">
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="main-menu-about-section__group">
        <h3 className="main-menu-about-section__heading bebas-neue-regular">Privacidad</h3>
        <p className="main-menu-about-section__text montserrat-regular">{APP_PRIVACY_NOTICE}</p>
      </div>

      <div className="main-menu-about-section__group">
        <h3 className="main-menu-about-section__heading bebas-neue-regular">Uso responsable</h3>
        <p className="main-menu-about-section__text montserrat-regular">{APP_LEGAL_NOTICE}</p>
      </div>

      <dl className="main-menu-about-section__meta montserrat-regular">
        <div className="main-menu-about-section__meta-row">
          <dt>Entorno</dt>
          <dd>{getAppRuntimeLabel()}</dd>
        </div>
      </dl>

      <p className="main-menu-about-section__copyright montserrat-regular">
        © {COPYRIGHT_YEAR} {APP_NAME}. Todos los derechos reservados.
      </p>
    </section>
  )
}
