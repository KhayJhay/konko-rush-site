/** Ghana, for the circuits map. Outline: Natural Earth (public domain), lon/lat. */
export const GHANA_OUTLINE: [number, number][] = [[1.06,5.929],[-0.508,5.343],[-1.064,5.001],[-1.965,4.71],[-2.856,4.994],[-2.811,5.389],[-3.244,6.25],[-2.984,7.38],[-2.562,8.22],[-2.827,9.642],[-2.964,10.395],[-2.94,10.963],[-1.203,11.01],[-0.762,10.937],[-0.439,11.098],[0.024,11.019],[-0.05,10.707],[0.368,10.191],[0.366,9.465],[0.461,8.677],[0.712,8.312],[0.491,7.412],[0.57,6.914],[0.837,6.28],[1.06,5.929]]

const LON0 = -1.03
const LAT0 = 7.95
const S = 2 / 6.5
/** lon/lat to map units: x east, z south, about [-0.7, 0.7] x [-1, 1] */
export const toMap = (lon: number, lat: number): [number, number] => [(lon - LON0) * S * 0.99, -(lat - LAT0) * S]
