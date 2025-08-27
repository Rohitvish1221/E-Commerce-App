import express from "express";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const router = express.Router();

// ---- TOTAL ANALYTICS ----
export const getAnalyticsData = async () => {
	try {
		const totalUsers = await User.countDocuments();
		const totalProducts = await Product.countDocuments();

		const salesData = await Order.aggregate([
			{
				$group: {
					_id: null,
					totalSales: { $sum: 1 }, // total number of orders
					totalRevenue: { $sum: "$totalAmount" }, // sum of all order totals
				},
			},
		]);

		const { totalSales, totalRevenue } =
			salesData.length > 0 ? salesData[0] : { totalSales: 0, totalRevenue: 0 };

		return {
			users: totalUsers,
			products: totalProducts,
			totalSales,
			totalRevenue,
		};
	} catch (error) {
		console.error("Error fetching analytics data:", error);
		throw new Error("Failed to fetch analytics data");
	}
};

// ---- DAILY SALES DATA ----
export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 }, // number of orders per day
					revenue: { $sum: "$totalAmount" }, // revenue per day
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// ensure we return all dates in range, even if no sales
		const dateArray = getDatesInRange(new Date(startDate), new Date(endDate));

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);
			return {
				name: date, // recharts uses `name`
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		console.error("Error fetching daily sales data:", error);
		throw new Error("Failed to fetch daily sales data");
	}
};

// ---- Helper: Get Dates in Range ----
function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}

// ---- ROUTES ----
router.get("/analytics", async (req, res) => {
	try {
		const data = await getAnalyticsData();
		res.json(data);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get("/analytics/daily", async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const data = await getDailySalesData(startDate, endDate);
		res.json(data);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// ---- DEFAULT EXPORT ----
export default router;
