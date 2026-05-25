# 将数字列表填入nums中，生成可行的相加方案
nums = [1, 2, 4, 8, 9, 11, 13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 26, 28, 35, 36, 43, 46, 47, 52]
for i in range(len(nums)):
	target = nums[i]
	methods = []
	for j in range(i):
		adder1 = nums[j]
		if adder1 > (target/2):
			break
		adder2 = target - adder1
		if adder2 in nums:
			methods.append([adder1, adder2])
	if len(methods) > 0:
		print(f"{target}: ",end="")
		print(methods,end=",\n")
