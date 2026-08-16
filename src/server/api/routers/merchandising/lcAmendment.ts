import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { currencyFormatter } from "~/utils/localNumberStrings";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

interface LcResponse {
    id: number;
    lc_no: string;
    lc_open_date: Date;
    lc_value: string;
    status: string;
    added_at: Date;
    currency_symbol: string;
    total_count: bigint;
}

export const lcAmendmentRouter = createTRPCRouter({
	getLcAmendments: protectedProcedure
		.input(
			z.object({
				limit: z.number().optional(),
				offset: z.number().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const can_view = ctx.permissions[m.LC_AMENDMENTS]?.can_view;

				if (!can_view) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to view LC Amendments.",
					});
				}

				const results = await ctx.db.$queryRaw<LcResponse[]>`
					WITH LC AS (
						SELECT 
							LCA.ID AS ID,
							B.BUYER_NAME AS BUYER_NAME,
							LC.LC_NO AS LC_NO,
							LC.LC_OPEN_DATE AS LC_OPEN_DATE,
							LC.LC_RECEIVED_DATE AS LC_RECEIVED_DATE,
							SUM(ST.RDL_VALUE) AS LC_VALUE,
							LC.IS_AUTHORIZED AS STATUS,
							COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
							LCA.AMENDMENT_NO AS AMENDMENT_NO,
							LC.ADDED_AT
						FROM lc_amendment AS LCA
							INNER JOIN LC_MASTER AS LC ON LC.ID = LCA.lc_id
							LEFT JOIN lc_amendment_orders AS LCD ON LCD.lc_amendment_id = LCA.id
							LEFT JOIN buyer_orders AS BO ON BO.id = LCD.order_id
							LEFT JOIN currencies AS C ON C.id = BO.secondary_currency_id
							INNER JOIN BUYERS AS B ON B.ID = LC.BUYER_ID
							LEFT JOIN (
								SELECT 
									OS.order_id AS ORDER_ID,
									SUM(SID.QUANTITY) * SD.FOB_RATE AS RDL_VALUE
								FROM order_styles AS OS 
									LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
									LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
								GROUP BY SD.id, OS.order_id, SD.FOB_RATE
							) ST ON ST.ORDER_ID = LCD.order_id
						WHERE (
							EXISTS ( -- Admin
								SELECT 1
								FROM USERS AS U
								WHERE U.ID = ${ctx.user.id}
									AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
									AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
							)
							OR EXISTS ( -- Team Member
								SELECT 1
								FROM TEAM_MEMBERS AS TM 
									INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
								WHERE T.BUYER_ID = LC.BUYER_ID
									AND TM.USER_ID = ${ctx.user.id}
							)
						)
						GROUP BY LCA.ID, LC.ID, LCA.ADDED_AT, B.BUYER_NAME, C.symbol
					)
					SELECT *,
						COUNT(*) OVER() AS TOTAL_COUNT
					FROM LC
					ORDER BY ADDED_AT DESC
					LIMIT ${input.limit}
                    OFFSET ${input.offset}
				;`

				const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                const lc = results.map(({total_count: _, ...lc}) => {
                    return {
                        ...lc,
                        lc_value: currencyFormatter(Number(lc.lc_value), lc.currency_symbol),
                    }
                });

                return { lc, total };
			} catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),

	searchLcAmendments: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const can_view = ctx.permissions[m.LC_AMENDMENTS]?.can_view;

				if (!can_view) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to view LC Amendments.",
					});
				}

				const results = await ctx.db.$queryRaw<LcResponse[]>`
				WITH LC AS (
						SELECT 
							LCA.ID AS ID,
							B.BUYER_NAME AS BUYER_NAME,
							LC.LC_NO AS LC_NO,
							LC.LC_OPEN_DATE AS LC_OPEN_DATE,
							LC.LC_RECEIVED_DATE AS LC_RECEIVED_DATE,
							SUM(ST.RDL_VALUE) AS LC_VALUE,
							LC.IS_AUTHORIZED AS STATUS,
							COALESCE(C.symbol, '$') AS CURRENCY_SYMBOL,
							LCA.AMENDMENT_NO AS AMENDMENT_NO,
							LC.ADDED_AT
						FROM lc_amendment AS LCA
							INNER JOIN LC_MASTER AS LC ON LC.ID = LCA.lc_id
							LEFT JOIN lc_amendment_orders AS LCD ON LCD.lc_amendment_id = LCA.id
							LEFT JOIN buyer_orders AS BO ON BO.id = LCD.order_id
							LEFT JOIN currencies AS C ON C.id = BO.secondary_currency_id
							INNER JOIN BUYERS AS B ON B.ID = LC.BUYER_ID
							LEFT JOIN (
								SELECT 
									OS.order_id AS ORDER_ID,
									SUM(SID.QUANTITY) * SD.FOB_RATE AS RDL_VALUE
								FROM order_styles AS OS 
									LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
									LEFT JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
								GROUP BY SD.id, OS.order_id, SD.FOB_RATE
							) ST ON ST.ORDER_ID = LCD.order_id
						WHERE (
							EXISTS ( -- Admin
								SELECT 1
								FROM USERS AS U
								WHERE U.ID = ${ctx.user.id}
									AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
									AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
							)
							OR EXISTS ( -- Team Member
								SELECT 1
								FROM TEAM_MEMBERS AS TM 
									INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
								WHERE T.BUYER_ID = LC.BUYER_ID
									AND TM.USER_ID = ${ctx.user.id}
							)
						)
						AND (
                            LC.LC_NO ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM lc_orders AS LCD2
                                    LEFT JOIN order_styles AS OS ON OS.order_id = LCD2.order_id
                                    LEFT JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                                    LEFT JOIN buyer_orders AS BO ON BO.ID = LCD.order_id 
                                WHERE LCD2.lc_master_id = LC.id
                                    AND (
                                        OS.style ILIKE '%' || ${input.query} || '%'
                                        OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                                        OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                                    )
                            )
                        )
						GROUP BY LCA.ID, LC.ID, LCA.ADDED_AT, B.BUYER_NAME, C.symbol
					)
					SELECT *,
						COUNT(*) OVER() AS TOTAL_COUNT
					FROM LC
					ORDER BY ADDED_AT DESC
					LIMIT ${input.limit}
                    OFFSET ${input.offset}
				;`

				const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
				const lc = results.map(({total_count: _, ...lc}) => {
					return {
						...lc,
						lc_value: currencyFormatter(Number(lc.lc_value), lc.currency_symbol),
					}
				});

				return { lc, total };
			}
			catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),


	deleteLcAmendment: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const can_delete = ctx.permissions[m.LC_AMENDMENTS]?.can_delete;

				if (!can_delete) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to delete LC Amendments.",
					});
				}

				return await ctx.db.$transaction(async (tx) => {
					const currentLcAmendment = await tx.lc_amendment.findUnique({
						where: {
							id: input.id,
						},
						select: {
							amendment_no: true,
							lc_master: {
								select: {
									is_authorized: true,
									lc_amendment_metadata: {
										select: {
											amendment_no: true
										}
									}
								}
							}
						}
					});

					const hasMoreRecentAmendment = (currentLcAmendment?.amendment_no ?? 0) < (currentLcAmendment?.lc_master?.lc_amendment_metadata?.amendment_no ?? 0);
					const isAuthorized = currentLcAmendment?.lc_master?.is_authorized ?? false;

					if (hasMoreRecentAmendment) {
						throw new TRPCError({
							code: "FORBIDDEN",	
							message: "This LC Amendment cannot be deleted as there are more recent amendments for the same LC.",
						});
					}

					if (isAuthorized) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "This LC Amendment cannot be deleted as the associated LC is authorized.",
						});
					}

					await tx.lc_amendment_metadata.updateMany({
						where: {
							lc_master: {
								lc_amendment: {
									some: {
										id: input.id,
									}								
								}
							}
						},
						data: {
							amendment_no: {
								decrement: 1,
							}
						}
					})

					const shipments = await tx.lc_amendment_shipments.findMany({
						where: {
							lc_amendment_id: input.id,
						}
					})

					for (const shipment of shipments) {
						await tx.lc_amendment_shipments_history.create({
							data: {
								lc_amendment_id: shipment.lc_amendment_id,
								shipment_details_id: shipment.shipment_details_id,
								lc_amendment_shipments_id: shipment.id,
								order_id: shipment.order_id,
								dm_pi_no: shipment.dm_pi_no,
								action_type: actions.DELETE,
								action_by: ctx.user.id,
							}
						})
					}

					await tx.lc_amendment_shipments.deleteMany({
						where: {
							lc_amendment_id: input.id,
						}
					})

					const orders = await tx.lc_amendment_orders.findMany({
						where: {
							lc_amendment_id: input.id,
						}
					})

					for (const order of orders) {
						await tx.lc_amendment_orders_history.create({
							data: {
								lc_amendment_id: order.lc_amendment_id,
								order_id: order.order_id,
								lc_amendment_orders_id: order.id,
								dm_pi_no: order.dm_pi_no,
								action_type: actions.DELETE,
								action_by: ctx.user.id,
							}
						})
					}

					await tx.lc_amendment_orders.deleteMany({
						where: {
							lc_amendment_id: input.id,
						}
					})

					const deletedLcAmendment = await tx.lc_amendment.delete({
						where: {
							id: input.id,
						}
					})

					if (!deletedLcAmendment) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "LC Amendment not found.",
						});
					}

					 await tx.lc_amendment_history.create({
						data: {
							lc_amendment_id: deletedLcAmendment.id,
							lc_id: deletedLcAmendment.lc_id,
							amendment_no: deletedLcAmendment.amendment_no,
							amend_quantity: deletedLcAmendment.amend_quantity,
							amend_value: deletedLcAmendment.amend_value,
							remarks: deletedLcAmendment.remarks,
							action_type: actions.DELETE,
							action_by: ctx.user.id,
						}
					 })
				}, {timeout: 30000});
			} catch (error) {
				await logError(error, ctx, input);
    			handlePrismaError(error);
			}
		}),

	getLcForAmendment: protectedProcedure
		.input(
			z.object({
				buyer_id: z.number(),
				lcAmendmentId: z.string().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const can_view = ctx.permissions[m.LC_AMENDMENTS]?.can_view;

				if (!can_view) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to view LC Amendments.",
					});
				}

				const lc = await ctx.db.$queryRaw<{id: string, lc_no: string}[]>`
					SELECT LC.id, LC.lc_no 
						FROM lc_master AS LC
						LEFT JOIN lc_amendment AS LCA 
							ON LCA.lc_id = LC.id
						WHERE LC.buyer_id = ${input.buyer_id}
						AND (
							( -- Only show authorized and active LCs if creating a new amendment
								${input.lcAmendmentId}::uuid IS NULL 
								AND LC.is_authorized = FALSE 
								AND LC.status = TRUE
							)
							OR ( -- Show lc for the current amendment being edited
								${input.lcAmendmentId}::uuid IS NOT NULL 
								AND LCA.id = ${input.lcAmendmentId}::uuid
							)
						);
				`

				if (!lc) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "LC not found.",
					});
				}

				return lc;
			} catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),

	createLcAmendment: protectedProcedure
		.input(
			z.object({
				lc_id: z.string(),
				amend_quantity: z.number().optional(),
				amend_value: z.number().optional(),
				remarks: z.string().optional(),
				orders: z
					.array(
						z.object({
							id: z.string().optional(),
							order_id: z.string(),
							pi_no: z.string().optional(),
						})
					)
					.optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const can_add = ctx.permissions[m.LC_AMENDMENTS]?.can_add;

				if (!can_add) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"You do not have permission to add LC Amendments.",
					});
				}

				return await ctx.db.$transaction(async (tx) => {
					const metaData =
						await tx.lc_amendment_metadata.upsert({
							where: {
								lc_id: input.lc_id,
							},
							update: {
								amendment_no: {
									increment: 1,
								},
							},
							create: {
								lc_id: input.lc_id,
								amendment_no: 1,
							},
						});

					const lcAmendmentNo = metaData.amendment_no;

					const newLcAmendment =
						await tx.lc_amendment.create({
							data: {
								lc_id: input.lc_id,
								amendment_no: lcAmendmentNo,
								amend_quantity: input.amend_quantity,
								amend_value: input.amend_value,
								remarks: input.remarks,
							},
						});

					await tx.lc_amendment_history.create({
						data: {
							lc_amendment_id: newLcAmendment.id,
							lc_id: newLcAmendment.lc_id,
							amendment_no:
								newLcAmendment.amendment_no,
							amend_quantity:
								newLcAmendment.amend_quantity,
							amend_value: newLcAmendment.amend_value,
							remarks: newLcAmendment.remarks,
							action_type: actions.ADDED,
							action_by: ctx.user.id,
						},
					});

					const existingOrders =
						await tx.lc_orders.findMany({
							where: {
								lc_master_id: input.lc_id,
							},
						});

					const ordersToDelete = existingOrders.filter(
						(existingOrder) =>
							!input.orders?.some(
								(order) =>
									order.id === existingOrder.id
							)
					);

					await Promise.all(
						ordersToDelete.map(async (order) => {
							await tx.lc_orders_history.create({
								data: {
									lc_master_id: order.lc_master_id,
									order_id: order.order_id,
									lc_orders_id: order.id,
									dm_pi_no: order.dm_pi_no,
									action_type: actions.DELETE,
									action_by: ctx.user.id,
								},
							});

							const shipments =
								await tx.lc_shipments.findMany({
									where: {
										lc_order_id: order.id,
									},
								});

							await Promise.all(
								shipments.map(async (shipment) => {
									await tx.lc_shipments_history.create({
										data: {
											lc_order_id:
												shipment.lc_order_id,
											shipment_details_id:
												shipment.shipment_details_id,
											lc_shipments_id:
												shipment.id,
											action_type:
												actions.DELETE,
											action_by: ctx.user.id,
										},
									});
								})
							);

							await tx.lc_shipments.deleteMany({
								where: {
									lc_order_id: order.id,
								},
							});

							await tx.lc_orders.delete({
								where: {
									id: order.id,
								},
							});
						})
					);

					const orders = await Promise.all(
						(input.orders ?? []).map(async (order) => {
							if (!order.id) {
								const newLcAmendmentOrder =
									await tx.lc_amendment_orders.create({
										data: {
											lc_amendment_id:
												newLcAmendment.id,
											order_id: order.order_id,
											dm_pi_no: order.pi_no,
										},
									});

								await tx.lc_amendment_orders_history.create({
									data: {
										lc_amendment_id:
											newLcAmendment.id,
										order_id: order.order_id,
										lc_amendment_orders_id:
											newLcAmendmentOrder.id,
										dm_pi_no: order.pi_no,
										action_type: actions.ADDED,
										action_by: ctx.user.id,
									},
								});

								const newLcOrder =
									await tx.lc_orders.create({
										data: {
											lc_master_id: input.lc_id,
											order_id: order.order_id,
											dm_pi_no: order.pi_no,
										},
									});

								await tx.lc_orders_history.create({
									data: {
										lc_master_id: input.lc_id,
										order_id: order.order_id,
										lc_orders_id: newLcOrder.id,
										dm_pi_no: order.pi_no,
										action_type: actions.ADDED,
										action_by: ctx.user.id,
									},
								});

								return {
									...newLcOrder,
									amendment_order_id:
										newLcAmendmentOrder.id,
								};
							}

							const updatedLcOrder =
								await tx.lc_orders.update({
									where: {
										id: order.id,
									},
									data: {
										dm_pi_no: order.pi_no,
									},
								});

							await tx.lc_orders_history.create({
								data: {
									lc_master_id: input.lc_id,
									order_id: order.order_id,
									lc_orders_id: order.id,
									dm_pi_no: order.pi_no,
									action_type: actions.UPDATE,
									action_by: ctx.user.id,
								},
							});

							const amendmentOrder =
								await tx.lc_amendment_orders.create({
									data: {
										lc_amendment_id:
											newLcAmendment.id,
										order_id: order.order_id,
										dm_pi_no: order.pi_no,
									},
								});

							await tx.lc_amendment_orders_history.create({
								data: {
									lc_amendment_id:
										newLcAmendment.id,
									order_id: order.order_id,
									lc_amendment_orders_id:
										amendmentOrder.id,
									dm_pi_no: order.pi_no,
									action_type: actions.ADDED,
									action_by: ctx.user.id,
								},
							});

							return {
								...updatedLcOrder,
								amendment_order_id:
									amendmentOrder.id,
							};
						})
					);

					return {
						amendment_id: newLcAmendment.id,
						orders,
					};
				}, {timeout: 30000});
			} catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),

	getLcDetailsForAmendment: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const can_view = ctx.permissions[m.LC_AMENDMENTS]?.can_view;

				if (!can_view) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to view LC Amendments.",
					});
				}

				const lcDetailsObj = await ctx.db.lc_master.findUnique({
					where: {
						id: input.id,
					},
					select: {
						id: true,
						lc_no: true,
						lc_open_date: true,
						lc_received_date: true,
						buyer_bank_id: true,
						lc_expire_date: true,
						currency_id: true,
						latest_shipment_date: true,
						rdl_bank_id: true,
						status: true,
						company_id: true,
						is_authorized: true,
						remarks: true,
						buyer_id: true,
						lc_orders: {
							select: {
								id: true,
								order_id: true,
								dm_pi_no: true,
								lc_shipments: {
                                    select: {
                                        shipment_details: {
                                            select: {
                                                buyer_po: true,
                                                fob_rate: true,
                                                shipment_item_details: {
                                                    select: {
                                                        quantity: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
							}
						}
					}
				});

				if (!lcDetailsObj) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "LC details not found.",
					});
				}
	
				const lcDetails = {
					...lcDetailsObj,
	
					order_lc_quantity: lcDetailsObj.lc_orders.reduce((total, order) => {
                        const orderQuantity = order.lc_shipments.reduce((shipmentTotal, shipment) => {
                            const shipmentQuantity = shipment.shipment_details?.shipment_item_details.reduce((itemTotal, item) => {
                                return itemTotal + item.quantity;
                            }, 0) ?? 0;
                            return shipmentTotal + shipmentQuantity;
                        }, 0);
                        return total + orderQuantity;
                    }, 0),

                    order_lc_value: lcDetailsObj.lc_orders.reduce((total, order) => {
                        const orderValue = order.lc_shipments.reduce((shipmentTotal, shipment) => {
                            const shipmentValue = (shipment.shipment_details?.fob_rate ?? 0) * (
                                shipment.shipment_details?.shipment_item_details.reduce((itemTotal, item) => {
                                    return itemTotal + item.quantity;
                                }, 0
                            ) ?? 0);
                            return shipmentTotal + shipmentValue;
                        }, 0);
                        return total + orderValue;
                    }, 0),

					lc_orders: lcDetailsObj?.lc_orders.map(order => ({
                        ...order,
                        po_no: order.lc_shipments.map(s => s?.shipment_details?.buyer_po).join(", "),
                    }))
				}

				return lcDetails;
			} catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),


	getLcAmendmentById: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const can_view = ctx.permissions[m.LC_AMENDMENTS]?.can_view;

				if (!can_view) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to view LC Amendments.",
					});
				}

				const lcAmendmentObj = await ctx.db.lc_amendment.findUnique({
					where: {
						id: input.id,
					},
					select: {
						id: true,
						lc_id: true,
						amendment_no: true,
						amend_quantity: true,
						amend_value: true,
						remarks: true,
						lc_master: {
							select: {
								buyer_id: true,
								is_authorized: true,
								lc_amendment_metadata: {
									select: {
										amendment_no: true,
									}
								}
							}
						},
						lc_amendment_orders: {
							select: {
								id: true,
								order_id: true,
								dm_pi_no: true,
								lc_amendment_shipments: {
									select: {
										shipment_details: {
											select: {
                                                buyer_po: true,
                                                fob_rate: true,
                                                shipment_item_details: {
                                                    select: {
                                                        quantity: true,
                                                    }
                                                }
											}
										}
									}
								}
							}
						}
					}
				});

				const lcAmendment = lcAmendmentObj && {
					...lcAmendmentObj,
					buyer_id: lcAmendmentObj.lc_master?.buyer_id,
					has_latest_amendment: (lcAmendmentObj.amendment_no ?? 0) < (lcAmendmentObj.lc_master?.lc_amendment_metadata?.amendment_no ?? 0),
					is_authorized: lcAmendmentObj.lc_master?.is_authorized,
					lc_amendment_orders: lcAmendmentObj.lc_amendment_orders.map(order => ({
						...order,
						po_no: order.lc_amendment_shipments.map(s => s?.shipment_details?.buyer_po).join(", "),
					}))
				}

				if (!lcAmendment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "LC Amendment not found.",
					});
				}

				return lcAmendment;
			} catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),

	updateLcAmendment: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				amend_quantity: z.number().optional(),
				amend_value: z.number().optional(),
				remarks: z.string().optional(),
				orders: z.array(
					z.object({
						id: z.string().optional(),
						order_id: z.string(),
						pi_no: z.string().optional(),
					})
				).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const can_update = ctx.permissions[m.LC_AMENDMENTS]?.can_update;

				if (!can_update) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to update LC Amendments.",
					});
				}

				return await ctx.db.$transaction(async (tx) => {

					// Get Amendment
					const existingLcAmendment = await tx.lc_amendment.findUnique({
						where: {
							id: input.id,
						},
						include: {
							lc_master: {
								select: {
									is_authorized: true,
									lc_amendment_metadata: {
										select: {
											amendment_no: true,
										},
									},
								},
							},
						},
					});

					if (!existingLcAmendment) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "LC Amendment not found.",
						});
					}

					const hasMoreRecentAmendment =
						(existingLcAmendment.amendment_no ?? 0) <
						(existingLcAmendment.lc_master?.lc_amendment_metadata?.amendment_no ?? 0);

					const isAuthorized = existingLcAmendment.lc_master?.is_authorized ?? false;

					if (hasMoreRecentAmendment) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "This LC Amendment cannot be updated as there are more recent amendments for the same LC.",
						});
					}

					if (isAuthorized) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "This LC Amendment cannot be updated as the associated LC is authorized.",
						});
					}

					// Update Amendment
					const updatedLcAmendment = await tx.lc_amendment.update({
						where: {
							id: input.id,
						},
						data: {
							amend_quantity: input.amend_quantity,
							amend_value: input.amend_value,
							remarks: input.remarks,
						},
					});

					await tx.lc_master.update({
						where: {
							id: updatedLcAmendment.lc_id!,
						},
						data: {
							lc_value: updatedLcAmendment.amend_value ?? undefined,
							quantity: updatedLcAmendment.amend_quantity ?? undefined,
						},
					});

					await tx.lc_amendment_history.create({
						data: {
							lc_amendment_id: updatedLcAmendment.id,
							lc_id: updatedLcAmendment.lc_id,
							amendment_no: updatedLcAmendment.amendment_no,
							amend_quantity: updatedLcAmendment.amend_quantity,
							amend_value: updatedLcAmendment.amend_value,
							remarks: updatedLcAmendment.remarks,
							action_type: actions.UPDATE,
							action_by: ctx.user.id,
						},
					});

					// Prepare Input Maps
					const inputOrders = input.orders ?? [];

					const inputOrderMap = new Map(
						inputOrders.map(order => [
							order.order_id,
							order,
						])
					);

					// LC Amendment Orders
					const existingAmendmentOrders = await tx.lc_amendment_orders.findMany({
							where: {
								lc_amendment_id: input.id,
							},
						});

					const existingAmendmentOrderMap = new Map(
						existingAmendmentOrders.map(order => [
							order.order_id,
							order,
						])
					);

					const existingAmendmentOrderIds = new Set(
						existingAmendmentOrders.map(order => order.order_id)
					);

					const amendmentOrdersToDelete = existingAmendmentOrders.filter(
						existing => !inputOrderMap.has(existing.order_id)
					);

					const amendmentOrdersToAdd = inputOrders.filter(
						order => !existingAmendmentOrderIds.has(order.order_id)
					);

					const amendmentOrdersToUpdate = existingAmendmentOrders.filter(
						existing =>	inputOrderMap.has(existing.order_id)
					);

					// Delete Amendment Shipments
					if (amendmentOrdersToDelete.length > 0) {
						const amendmentOrderIdsToDelete = amendmentOrdersToDelete.map(order => order.order_id);

						const shipmentsToDelete = await tx.lc_amendment_shipments.findMany({
							where: {
								lc_amendment_id: input.id,
								order_id: {
									in: amendmentOrderIdsToDelete,
								},
							},
						});

						if (shipmentsToDelete.length > 0) {
							await tx.lc_amendment_shipments_history.createMany({
								data: shipmentsToDelete.map(shipment => ({
									lc_amendment_id: shipment.lc_amendment_id,
									shipment_details_id:
										shipment.shipment_details_id,
									lc_amendment_shipments_id: shipment.id,
									order_id: shipment.order_id,
									dm_pi_no: shipment.dm_pi_no,
									action_type: actions.DELETE,
									action_by: ctx.user.id,
								})),
							});

							await tx.lc_amendment_shipments.deleteMany({
								where: {
									lc_amendment_id: input.id,
									order_id: {
										in: amendmentOrderIdsToDelete,
									},
								},
							});
						}

						await tx.lc_amendment_orders_history.createMany({
							data: amendmentOrdersToDelete.map(order => ({
								lc_amendment_id: order.lc_amendment_id,
								order_id: order.order_id,
								lc_amendment_orders_id: order.id,
								dm_pi_no: order.dm_pi_no,
								action_type: actions.DELETE,
								action_by: ctx.user.id,
							})),
						});

						await tx.lc_amendment_orders.deleteMany({
							where: {
								lc_amendment_id: input.id,
								id: {
									in: amendmentOrdersToDelete.map(
										order => order.id
									),
								},
							},
						});
					}

					// Add Amendment Orders
					if (amendmentOrdersToAdd.length > 0) {
						await tx.lc_amendment_orders.createMany({
							data: amendmentOrdersToAdd.map(order => ({
								lc_amendment_id: input.id,
								order_id: order.order_id,
								dm_pi_no: order.pi_no,
							})),
						});

						const createdAmendmentOrders = await tx.lc_amendment_orders.findMany({
								where: {
									lc_amendment_id: input.id,
									order_id: {
										in: amendmentOrdersToAdd.map(
											order => order.order_id
										),
									},
								},
							});

						await tx.lc_amendment_orders_history.createMany({
							data: createdAmendmentOrders.map(order => ({
								lc_amendment_id: order.lc_amendment_id,
								order_id: order.order_id,
								lc_amendment_orders_id: order.id,
								dm_pi_no: order.dm_pi_no,
								action_type: actions.ADDED,
								action_by: ctx.user.id,
							})),
						});
					}

					// Update Amendment Orders
					await Promise.all(
						amendmentOrdersToUpdate.map(async existingOrder => {
							const inputOrder = inputOrderMap.get(existingOrder.order_id);
							const dm_pi_no = inputOrder?.pi_no ?? null;

							if (existingOrder.dm_pi_no === dm_pi_no) {
								return;
							}

							await Promise.all([
								tx.lc_amendment_orders.update({
									where: {
										id: existingOrder.id,
									},
									data: {
										dm_pi_no,
									},
								}),

								tx.lc_amendment_orders_history.create({
									data: {
										lc_amendment_id: input.id,
										order_id: existingOrder.order_id,
										lc_amendment_orders_id:
											existingOrder.id,
										dm_pi_no,
										action_type: actions.UPDATE,
										action_by: ctx.user.id,
									},
								}),
							]);
						})
					);

					// LC Orders
					const existingLcOrders = await tx.lc_orders.findMany({
						where: {
							lc_master_id: existingLcAmendment.lc_id,
						},
					});

					const existingLcOrderMap = new Map(
						existingLcOrders.map(order => [
							order.order_id,
							order,
						])
					);

					const existingLcOrderIds = new Set(
						existingLcOrders.map(order => order.order_id)
					);

					const lcOrdersToDelete = existingLcOrders.filter(
						existing => !existing.order_id || !inputOrderMap.has(existing.order_id)
					);

					const lcOrdersToAdd = inputOrders.filter(
						order => !existingLcOrderIds.has(order.order_id)
					);

					const lcOrdersToUpdate = existingLcOrders.filter(
						existing => !!existing.order_id && inputOrderMap.has(existing.order_id)
					);

					// Delete LC Shipments
					if (lcOrdersToDelete.length > 0) {
						const lcOrderIdsToDelete = lcOrdersToDelete.map(order => order.id);

						const shipmentsToDelete = await tx.lc_shipments.findMany({
							where: {
								lc_order_id: {
									in: lcOrderIdsToDelete,
								},
							},
						});

						if (shipmentsToDelete.length > 0) {
							await tx.lc_shipments_history.createMany({
								data: shipmentsToDelete.map(shipment => ({
									lc_order_id: shipment.lc_order_id,
									shipment_details_id:
										shipment.shipment_details_id,
									lc_shipments_id: shipment.id,
									action_type: actions.DELETE,
									action_by: ctx.user.id,
								})),
							});

							await tx.lc_shipments.deleteMany({
								where: {
									lc_order_id: {
										in: lcOrderIdsToDelete,
									},
								},
							});
						}

						await tx.lc_orders_history.createMany({
							data: lcOrdersToDelete.map(order => ({
								lc_master_id: order.lc_master_id,
								order_id: order.order_id,
								lc_orders_id: order.id,
								dm_pi_no: order.dm_pi_no,
								action_type: actions.DELETE,
								action_by: ctx.user.id,
							})),
						});

						await tx.lc_orders.deleteMany({
							where: {
								lc_master_id: existingLcAmendment.lc_id,
								id: {
									in: lcOrderIdsToDelete,
								},
							},
						});
					}

					// Add LC Orders
					if (lcOrdersToAdd.length > 0) {
						await tx.lc_orders.createMany({
							data: lcOrdersToAdd.map(order => ({
								lc_master_id: existingLcAmendment.lc_id,
								order_id: order.order_id,
								dm_pi_no: order.pi_no,
							})),
						});

						const createdLcOrders = await tx.lc_orders.findMany({
							where: {
								lc_master_id:
									existingLcAmendment.lc_id,
								order_id: {
									in: lcOrdersToAdd.map(
										order => order.order_id
									),
								},
							},
						});

						await tx.lc_orders_history.createMany({
							data: createdLcOrders.map(order => ({
								lc_master_id: order.lc_master_id,
								order_id: order.order_id,
								lc_orders_id: order.id,
								dm_pi_no: order.dm_pi_no,
								action_type: actions.ADDED,
								action_by: ctx.user.id,
							})),
						});
					}

					// Update LC Orders
					await Promise.all(
						lcOrdersToUpdate.map(async existingOrder => {
							const inputOrder = existingOrder.order_id == null
								? undefined
								: inputOrderMap.get(existingOrder.order_id);

							const dm_pi_no = inputOrder?.pi_no ?? null;

							if (existingOrder.dm_pi_no === dm_pi_no) {
								return;
							}

							await Promise.all([
								tx.lc_orders.update({
									where: {
										id: existingOrder.id,
									},
									data: {
										dm_pi_no,
									},
								}),

								tx.lc_orders_history.create({
									data: {
										lc_master_id:
											existingOrder.lc_master_id,
										order_id: existingOrder.order_id,
										lc_orders_id: existingOrder.id,
										dm_pi_no,
										action_type: actions.UPDATE,
										action_by: ctx.user.id,
									},
								}),
							]);
						})
					);

					return updatedLcAmendment;
				}, {timeout: 30000});
			}
			catch (error) {
				await logError(error, ctx, input);
                handlePrismaError(error);
			}
		}),
});
