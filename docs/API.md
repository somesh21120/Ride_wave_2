# RideWave API Reference

Base URL: `http://localhost:5000/api` locally (the frontend calls `/api`, proxied by Vite), or `VITE_API_URL` when hosted.

Auth: send `Authorization: Bearer <token>` (token comes from login/register). Errors always look like `{ "message": "..." }`.

Legend: Auth column = `public`, `user` (any logged-in user), `driver`, `admin`.

## Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | public | `{ status, version, build, poolMatcher, env, db, uptimeSeconds, time }`. Use it to check a deployment. |

## Auth `/auth`
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | /auth/send-otp | public | `{ email }` → `{ message, otp }` (OTP returned for demo) |
| POST | /auth/register | public | `{ name, email, password, phone, role: passenger or driver, otp, vehicleType?, vehicleModel?, vehicleNumber?, carSubtype?, seatingCapacity? }` → user + token |
| POST | /auth/login | public | `{ email, password }` → user + token. 403 if the account is deactivated |
| GET | /auth/profile | user | current user |
| PUT | /auth/profile | user | `{ name?, phone?, vehicleType?, vehicleModel?, vehicleNumber?, carSubtype?, seatingCapacity? }` |

## Saved Places `/auth/places`
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| GET | /auth/places | user | Returns array of saved places |
| POST | /auth/places | user | `{ label (1-30 chars), address, lat, lng }` → updated array. Max 5 places |
| PUT | /auth/places/:index | user | `{ label?, address?, lat?, lng? }` → updated array |
| DELETE | /auth/places/:index | user | → updated array |

## Rides `/rides`
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | /rides/book | user | `{ pickupLocation, dropoffLocation, rideType, paymentMethod, distance, rideCategory?, poolType?, seatsTotal?, instantPool? }`. Rejects distance over 50 km. Emits `ride:updated` + `ride:new` |
| GET | /rides/my-rides | user | passenger's rides, newest first, with driver (name, phone, vehicle) and `startOtp` (ride code) while accepted |
| GET | /rides/driver-rides | driver | rides assigned to this driver |
| GET | /rides/available | driver | open requests for the driver's vehicle type, excluding rejected ones and pools still matching |
| GET | /rides/pools | user | open manual pools with free seats |
| GET | /rides/:id | user | only for people on the ride, drivers viewing an open request, or admin |
| GET | /rides/:id/match-status | user | instant-pool status: `{ poolMatchStatus, fare, poolSavings, poolMatcher, poolMatchNote, ... }` |
| PUT | /rides/:id/accept | driver | atomic; 409 if someone else took it; 400 if the driver already has an active ride |
| PUT | /rides/:id/reject | driver | hide this request from the driver |
| PUT | /rides/:id/start | driver (assigned) | `{ otp }` 4-digit ride code from the passenger; accepted → ongoing. 400 if missing or wrong |
| PUT | /rides/:id/complete | driver (assigned) | ongoing → completed, paymentStatus paid |
| PUT | /rides/:id/cancel | passenger or assigned driver | passenger: cancels. Driver on an accepted ride: releases it back to "requested" |
| POST | /rides/:id/join | user | `{ pickupLocation, distance }` join a manual pool |
| POST | /rides/:id/leave | user | leave a manual pool |

## Recurring rides `/recurring`
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /recurring | user | `{ pickupLocation, dropoffLocation, rideType, paymentMethod, time: "HH:MM", daysOfWeek: [0..6] }` |
| GET | /recurring/my | user | |
| PUT | /recurring/:id | user | any of the above + `active` |
| DELETE | /recurring/:id | user | |

## Reviews `/reviews`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /reviews | user | `{ rideId, rating 1-5, comment? }`; reviewee decided by role |
| GET | /reviews/received/:userId | user | own reviews only (admin: anyone) |
| GET | /reviews/written | user | |
| GET | /reviews/all | admin | |
| DELETE | /reviews/:id | admin | |

## Payments `/payment` (Razorpay test mode)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /payment/create-order | user | `{ amount }` in rupees → `{ id, amount (paise), currency, key }` |
| POST | /payment/verify | user | `{ orderId, paymentId, signature }` → `{ verified: true }` |

## Admin `/admin` (all routes admin only)
| Method | Path | Notes |
|---|---|---|
| GET | /admin/stats | counts (users, drivers, passengers, rides, completed, requested, active, cancelled, pooled, recurring, open pools), revenue, poolSavings, recentRides |
| GET | /admin/users?role=&search= | list users |
| POST | /admin/users | **new in v2**: create driver/passenger/admin `{ role, name, email, phone, password, vehicleType, vehicleNumber, vehicleModel?, carSubtype?, seatingCapacity? }` |
| PUT | /admin/users/:id | `{ role?, isActive?, isVerified?, name?, phone?, vehicleType?, vehicleModel?, vehicleNumber?, carSubtype?, seatingCapacity? }` |
| DELETE | /admin/users/:id | cannot delete yourself |
| GET | /admin/rides?status= | latest 200 |
| GET | /admin/rides/:id | **new in v2**: full ride detail with passenger, driver, co-riders |
| PUT | /admin/rides/:id | `{ status }` admin override |
| DELETE | /admin/rides/:id | |
| GET | /admin/recurring | all recurring schedules |

## Pooling Lab `/lab` (public, simulated data, read-only)
| Method | Path | Notes |
|---|---|---|
| GET | /lab/simulate?perHour=240&seed=1&mode=corridor | one 30-minute simulated day: requests, pools (route, members, accepted, AI prediction), metrics. `mode` = proximity, corridor or smart |
| GET | /lab/compare?perHour=240&seed=1 | metrics for all three methods, averaged over 10 simulated one-hour days |
| GET | /lab/model | AI model card: dataset size, train/test accuracy and AUC, learned weights, discovered corridors |

`/health` also reports `aiModel: "loaded" | "not trained"`.

## Socket.IO events
See ARCHITECTURE.md section 5.
