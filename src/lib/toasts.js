import { sileo } from 'sileo'

export const toast = {
  success(title, description) {
    return sileo.success({ title, description })
  },
  error(title, description) {
    return sileo.error({ title, description })
  },
  info(title, description) {
    return sileo.info({ title, description })
  },
  warning(title, description) {
    return sileo.warning({ title, description })
  },
}
