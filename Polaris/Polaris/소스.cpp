#include<stdio.h>
int main()

{
	float a, b;
	float result;
	char k;
	printf("첫번째 값을 입력해주세요:");
	scanf_s("%f", &a);
	printf("연산 기호를 입력해주세요:");
	scanf_s("%*c%c", &k, 1);
	printf("두번째 값을 입력해주세요:");
	scanf_s("%f", &b);
	if (k == '+')
	{
		result = a + b;
		printf("%f + %f = %f", a, b, result);
	}
	if (k == '-')
	{
		result = a - b;
		printf("%f - %f = %f", a, b, result);
	}
	if (k == '*')
	{
		result = a * b;
		printf("%f * %f = %f", a, b, result);
	}
	if (k == '/') {
		if (b == 0)
		{
			//0으로 나눌때 오류 방지#include<stdio.h>
int main()

{
	float a, b;
	float result;
	char k;
	printf("첫번째 값을 입력해주세요:");
	scanf_s("%f", &a);
	printf("연산 기호를 입력해주세요:");
	scanf_s("%*c%c", &k, 1);
	printf("두번째 값을 입력해주세요:");
	scanf_s("%f", &b);
	if (k == '+')
	{
		result = a + b;
		printf("%f + %f = %f", a, b, result);
	}
	else if (k == '-')
	{
		result = a - b;
		printf("%f - %f = %f", a, b, result);
	}
	else if (k == '*')
	{
		result = a * b;
		printf("%f * %f = %f", a, b, result);
	}
	else if (k == '/') {
		if (b == 0)
		{
			//0으로 나눌때 오류 방지
			printf("0으로는 나눌 수 없습니다.");
			return 0;
		}
		else
			result = a / b;
		printf("%f / %f = %f", a, b, result);
	}
	else
		printf("잘못된 연산입니다.");
	getch();
	return 0;
}
